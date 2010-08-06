/*
This file is part of Philosophy.

    Philosophy is free software: you can 
    redistribute it and/or modify it under the terms of the GNU 
    General Public License as published by the Free Software Foundation, 
    either version 3 of the License, or any later version.

    Philosophy is distributed in the hope that it 
    will be useful, but WITHOUT ANY WARRANTY; without even the implied 
    warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  
    See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Philosophy.  
    If not, see <http://www.gnu.org/licenses/>
*/

// Object for drawing things used in philosophy.
// Takes paper.
function DrawPhilosophy(ra)
{
   // Instance variable, Raphael
   paper = ra;

   // Joint element creator.
   // Takes an object and function which creates a Raphael element.
   // Returns a Joint element for the object, with an init method that:
   //    Sets the wrapper as the Raphael element produced when the init properties were applied to the Raphael creation function. (see http://www.jointjs.com/api/symbols/Joint.dia.Element.html#constructor)
   this.element = function(obj, raphf, props)
   {
      // Add an init method to the object which sets the wrapper
      obj.init = function(properties)
      {
         this.setWrapper(raphf(properties));
      }

      // The new element creator
      var e_class = Joint.dia.Element.extend(obj);

      // Return the new element.
      return e_class.create(props);
   }

   // Takes an object,
   // Draws a circle for it.
   // Returns the Joint element for the object
   this.circle = function(phil, xp, yp, rad)
   {
      // Properties for our new element.
      var props = {position: {x: xp, y: yp},
                   radius: rad};

      // A function that creates a circle from raphael properties
      function circlep(props)
      {
         return this.paper.circle(props.position.x, props.position.y, props.radius);
      }

     
      return this.element(phil, circlep, props);
   }
}

// Engage warp drive!
// Takes an element id or an HTML element, and then a width and a height.
// Returns a computations which initializes Joint, and returns a nice interface to the drawing library. 
function philosophy(id, width, height)
{
   // Initialize the diagramming library
   function Initialize(elem)
   {
      // Initializes Raffles
      var raph = Raphael(elem, width, height);

      // Initialize Joint
      Joint.paper(raph, width, height);

      // Return a nice interface to the drawing library. 
      return new DrawPhilosophy(raph);
   }

   // Return a computation which initializes the drawing library on the given element.
   return ElementA(id).then(Initialize);
}
