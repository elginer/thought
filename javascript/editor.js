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

// Takes an editor and the editor width
// Initializes the editor
function initialize_editor(editor, ew, state)
{
   // Set the style for the editor.
   var ed = $("#" + editor).css({float: "left", width: ew});


   // A widget for creating a new thought
   function new_thought()
   {
      // Heading for creating a thought
      var head = document.createElement("h2");
      // Text for inside the header
      $(head).append(document.createTextNode("Add a new thought"));

      // Field for new thought's name
      var inp = document.createElement("input");
      // Button to create new thought
      var create = document.createElement("input");
      $(create).attr("type", "button");
      $(create).val("Think it");

      // Add a new thought
      function add_thought()
      {
         var val = $(inp).val();
         // Check for valid thought
         if (val.length > 0)
         {
            // Create a new thought with that name
            var thought = new Thought(val, {thinker: "", text: ""});
            // Run the computation to draw the thought.
            var drawA = thought.draw(300, 300);
            drawA(state);
         }
         else
         {  // Ho ho ho!
            alert("Error: This is philosophy.  Give your thought a name.");
         }
      
      }

      $(create).click(add_thought);
      // A box to put these in
      var box = document.createElement("p");
      $(box).append(head);
      $(box).append(inp);
      $(box).append(create);

      // Return the creation element
      return box;
   }

   // Reset the editor back to its original state.
   function reset()
   {
      $(ed.empty());
      $(ed).append(new_thought());
      return ed;
   }

   // Add a method to the editor element that resets it.
   ed.reset = reset;
   // Reset the editor
   ed.reset();
   return ed;
   
}

// Arrow for editting a thought
function EditA(thought, state)
{

   // Display the thought itself
   function thought_title()
   {
      // Heading for the thought
      var thoughth = document.createElement("h2");
      
      // Text for the thought.
      var abstrakt = document.createTextNode(thought.thought);

      // Put the text in the header
      $(thoughth).append(abstrakt);

      return thoughth;
   }

   // Make the first letter of the string upper case
   function first_upper(text)
   {
      return text.slice(0,1).toUpperCase() + text.slice(1);
   }

   // An edit box
   function edit_box(field)
   {
      // Box to surround the field
      var editp = document.createElement("p");
      
      // The name of the field
      var name = document.createTextNode(first_upper(field) + " ");

      // Edit field
      var input = $(document.createElement("input")).val(thought.details[field]);

      // When the field is edited, update the details
      $(input).keyup(function(){ thought.details[field] = $(input).val();});

      // Put the name and the field in the edit box
      $(editp).append(name);
      $(editp).append(input);

      return editp; 
   }

   // Destroy the thought
   function destroy()
   {
      // Destroy the thought
      function destroyer(e)
      {// Only proceed if you're sure
         if (confirm("Are you sure you want to un-think this thought?"))
         {
            // Delete the thought
            thought.unthink();
            // Clean the editor
            state.editor.reset();
         }
      }

      // Create a button for destroying this thought
      var del = document.createElement("input");
      $(del).attr("type", "button");
      $(del).val("Un-think this");
      $(del).click(destroyer);
      return del;
   }

   // Edit the thought
   function edit()
   {
      // Get a clean editor
      editor = state.editor.reset();

      // Print the title of the thought
      $(editor).append(thought_title());

      // Edit fields 
      for(var detail in thought.details)
      {
         // In Haskell, I'd delete the key.  But Javascript, I'd have to clone the object, and then delete the key....
         if (detail)
          {
             $(editor).append(edit_box(detail));
          }
      }

      // A button to destroy the idea
      $(editor).append(destroy());
   }

   return edit;
}

