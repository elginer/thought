{- 
   Prototype for the inference engine.
   That is, a mechanism for determining whether or not
   a sequence of logical relations is valid or invalid
   and informing the user of any invalid relations.
  
   Furthermore, as a prototype, this module defines an 
   api and alogrithmic structure to be implemented 
   again in javascript
-}

-- We use mutable arrays here for dynamic programming
import Data.Array.IO

-- We use sets to guarantee uniqueness
import Data.Set (Set)
import qualified Data.Set as S

-- We use maps for associations
import Data.Map (Map)
import qualified Data.Map as M

-- We use faster maps with integers as keys
import Data.IntMap (IntMap)
import qualified Data.IntMap as I

-- We use a risky fromMaybe
import Data.Maybe

-- Fold over abstract data types
import qualified Data.Foldable as F

-- Monads for control
import Control.Monad
-- Arrows for control
import Control.Arrow

-- Monad transformers
import Control.Monad.Trans.Class

-- Writer monad
import Control.Monad.Trans.Writer.Strict

-- State monad
import Control.Monad.Trans.State.Strict

-- Choice
import Data.Either

-- Monad transformer, it accumulates a set of invalid relationships
type Validator = WriterT (Set (Error, Set BinaryRelation)) IO

-- Array access monad.  Stores set of valid 2D array locations.
type ArrayAccess = StateT (Set (Int, Int))

-- Inform of a new valid cell
valid_cell :: Monad m => Int -> Int -> ArrayAccess m ()
valid_cell top bottom = modify $
   S.insert (top, bottom)

-- Validator stacked with array access
type ArrValidator = ArrayAccess Validator 

-- Atoms are just strings
type Atom = String

-- Errors
data Error
   = -- There are multiple relationships between two atoms
     Incest
   | -- The relationship is a contradiction (bottom)
     Contradiction
   deriving (Eq, Ord, Show)
   
-- Create a new error
new_error :: Error -> Set BinaryRelation -> Validator ()
new_error e bs =
   tell $ S.singleton (e, bs) 

-- A binary relation between two atoms
data BinaryRelation 
   = Implies { bfst :: Atom, bsnd :: Atom}
   | Iff { bfst :: Atom, bsnd :: Atom}
   | ImpliesNot { bfst :: Atom, bsnd :: Atom}
   deriving (Eq, Ord, Show)

-- A simpler binary relation format
data SRelation
   = SImplies { sfst :: Atom, ssnd :: Atom }
   | SImpliesNot { sfst :: Atom, ssnd :: Atom }
   deriving (Eq, Ord, Show)

-- Single arity version of binary relations 
-- where the first operand is the possessor of the relation in a map.
-- Not to be confused with unary logical relations
data URelation a
   = UImplies {ufst :: a}
   | UImpliesNot {ufst :: a}
   deriving (Ord, Eq, Show)

-- Zero arity verson of the above.
data ZRelation
   = ZImplies
   | ZImpliesNot
   deriving (Eq, Ord, Show)

-- Relationships between an atom and other atoms
type Relationships = Map Atom (Set (URelation Atom, BinaryRelation))

-- Relationships between ints and other ints
type IntRelations = IntMap (Set (URelation Int, BinaryRelation))

-- A 2d array representing relationships between atoms
type RelationArray = IOArray Int (IOArray Int (Maybe ZRelation, Set BinaryRelation))

-- Take a set of relations. 
-- And return a (possibly empty) set of invalid relations
validate :: Set BinaryRelation -> IO (Set (Error, Set BinaryRelation))
validate brs = execWriterT $ flip runStateT S.empty $ do
   arr <- tabulate $ unari $ simplify brs 
   find_relationships arr
   check_validity arr

-- Simplify the binary relations
simplify :: Set BinaryRelation -> Set (SRelation, BinaryRelation)
simplify =
   F.foldr simplify_one S.empty
   where
   simplify_one :: BinaryRelation -> Set (SRelation, BinaryRelation) -> Set (SRelation, BinaryRelation)
   simplify_one br sset =
      foldr S.insert sset $
         case br of
            Implies fst snd    -> [(SImplies fst snd, br)]
            ImpliesNot fst snd -> [(SImpliesNot fst snd, br)]
            Iff fst snd        -> [(SImplies fst snd, br), (SImplies snd fst, br)]
         

-- Convert binary to unary relationships with an implict owner
unari :: Set (SRelation, BinaryRelation) -> Relationships
unari = F.foldr (uncurry unfirst) M.empty
   where
   unfirst :: SRelation -> BinaryRelation -> Relationships -> Relationships
   unfirst sb br =
         M.alter  
            (Just . maybe
               (S.singleton (ubr, br))
               (S.insert (ubr, br)))
            (sfst sb)
      where
      -- The Urelationship associated with sb 
      ubr :: URelation Atom
      ubr = 
         urelationship sb

-- Convert a binary to a unary relationship with implicit owner
urelationship :: SRelation -> URelation Atom
urelationship r = 
   case r of
      SImplies _ snd      -> UImplies snd
      SImpliesNot _ snd   -> UImpliesNot snd

-- Convert an association between atoms and relationships
-- to an efficient 2d array describing relationships
-- Also, at this stage the logic might already be found to be invalid
-- so provide a (possibly empty) set of invalid relationships
tabulate :: Relationships -> ArrValidator RelationArray
tabulate = create_array . atom_to_int 

-- Convert an association with atoms to relationships
-- to an association between integers and 
atom_to_int :: Relationships -> IntRelations
atom_to_int rels =
   M.foldWithKey int_relation I.empty rels
   where
   -- Transform a set of atom relationships to a set of int relationships
   int_relation :: Atom
                -> Set (URelation Atom, BinaryRelation) 
                -> IntRelations
                -> IntRelations
   int_relation atom are =
      I.insert (alookup atom) (S.map (first ar_to_ir) are)
      where
      -- Transform atom relations to int relations
      ar_to_ir :: URelation Atom -> URelation Int
      ar_to_ir ar = f $ alookup $ ufst ar
         where
         f =
            case ar of
               UImplies _     -> UImplies
               UImpliesNot _  -> UImplies
      alookup :: Atom -> Int
      alookup a =
         fromMaybe
            (error $ "BUG: Could not find atom " ++ a) $
               M.lookup a atom_int
   -- Association between atoms and integers
   atom_int :: Map Atom Int
   atom_int = M.fromList $ zip (M.keys rels) [0 ..]

-- Write a new relationship to the nested array
new_relation_nest :: IOArray Int (Maybe ZRelation, Set BinaryRelation)
                  -> Int
                  -> ZRelation
                  -> Set BinaryRelation
                  -> ArrValidator ()
new_relation_nest arr index relation bin_set = do
   (old_relation, old_binset) <- lift $ lift $ readArray arr index
   maybe write_relation (perhaps_delete_cell old_binset) old_relation
   where
   -- If the old relation is the same as the new, then all is well.
   -- Otherwise there are two different relationships between the same
   -- two atoms.
   perhaps_delete_cell old_binset old_rel =
      if old_rel == relation
         then return ()
         else delete_cell old_binset
   -- There was a relation already in the cell,
   -- so delete the cell contents and note an error
   delete_cell old_binset = lift $ do
      new_error Incest $ bin_set `S.union` old_binset
      lift $ writeArray arr index (Nothing, S.empty)
   -- write the relation
   write_relation = lift $ lift $
      writeArray arr index (Just relation, bin_set)

-- Create the array
create_array :: IntRelations -> ArrValidator RelationArray
create_array imap =
   I.foldWithKey write_urelation construct_array imap
   where
   -- Write a URelation to the array
   write_urelation :: Int 
                   -> Set (URelation Int, BinaryRelation)
                   -> ArrValidator RelationArray 
                   -> ArrValidator RelationArray
   write_urelation top urels io_arr = do
      top_arr <- io_arr
      bottom_arr <- lift $ lift $ readArray top_arr top
      F.mapM_ (uncurry (initialize_cell top bottom_arr)) urels
      return top_arr

   -- Write the initial data to the cell
   initialize_cell :: Int
                   -> IOArray Int (Maybe ZRelation, Set BinaryRelation)
                   -> URelation Int 
                   -> BinaryRelation
                   -> ArrValidator ()
   initialize_cell top arr urel bin = do
      valid_cell top (ufst urel)
      new_relation_nest
         arr 
         (ufst urel)
         (urel_to_zrel urel)
         (S.singleton bin)

   -- Convert a URElation to a ZRelation
   urel_to_zrel :: URelation a -> ZRelation
   urel_to_zrel urel =
      case urel of
         UImplies _     -> ZImplies
         UImpliesNot _  -> ZImplies
   
   -- Create the array
   construct_array :: ArrValidator RelationArray
   construct_array = lift $ lift $
      replicateM (asize + 1) (newArray (0, asize) empty_cell) >>=
         newListArray (0, asize)
   -- An empty cell
   empty_cell :: (Maybe ZRelation, Set BinaryRelation)
   empty_cell =
      (Nothing, S.empty)
   -- The array size
   asize = I.size imap - 1 

-- Find more relations and update the array
find_relationships :: RelationArray -> ArrValidator () 
find_relationships arr = undefined 

-- Find invalid propositions
check_validity :: RelationArray -> ArrValidator ()
check_validity arr = do
   iffs <- find_implicators arr
   bin_sets <- invalid_implicate_nots iffs arr
   lift $ mapM_ (new_error Contradiction) bin_sets

-- Find invalid implicate nots
invalid_implicate_nots :: Set ((Int, Int), Set BinaryRelation) -> RelationArray -> ArrValidator [Set BinaryRelation]
invalid_implicate_nots imps arr = fmap catMaybes $
   mapM (uncurry $ uncurry invalid_not) $ S.toList imps
   where
   -- Find an implicate not which contradicts "from implies to"
   invalid_not from to bin_set = lift $ lift $ do
      (mrel, inv_bin_set) <- read_mrarr arr to from 
      return $ mrel >>= (check_valid_relation inv_bin_set)
      where
      check_valid_relation inv_bin_set rel =
         case rel of
            ZImpliesNot -> Just $ bin_set `S.union` inv_bin_set 
            _           -> Nothing

-- Lookup a relation.  Relation index must point to valid cell.
read_rarr :: RelationArray -> Int -> Int -> IO (ZRelation, Set BinaryRelation)
read_rarr arr top nest =
   fmap (first $ fromMaybe (error $ "BUG: no relation at " ++ show (top, nest))) $
      read_mrarr arr top nest

-- Lookup a realation
read_mrarr :: RelationArray -> Int -> Int -> IO (Maybe ZRelation, Set BinaryRelation)
read_mrarr arr top nest =
   readArray arr top >>= flip readArray nest
   
-- Find implicators: get all Implies in the array
-- Return the operands of the all the Implies and their assocated BinaryRelations
find_implicators :: RelationArray -> ArrValidator (Set ((Int, Int), Set BinaryRelation))
find_implicators arr =
   get >>= F.foldrM (uncurry find_implicator) S.empty
   where
   find_implicator :: Int 
                   -> Int
                   -> Set ((Int, Int), Set BinaryRelation)
                   -> ArrValidator (Set ((Int, Int), Set BinaryRelation))
   find_implicator top nest imps = lift $ lift $ do
      (rel, bin_set) <- read_rarr arr top nest
      return $ case rel of
         ZImplies -> S.insert ((top, nest), bin_set) imps 
         _        -> imps
