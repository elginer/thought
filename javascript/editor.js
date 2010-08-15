/*

This file is part of Philosophy.

    Philosophy is free software: you can 
    redistribute it and/or modify it under the terms of the GNU 
    General Public License as published by the Free Software Foundation, 
    either version 3 of the License, or any later version.

    Philosophy is disthis.editored in the hope that it 
    will be useful, but WITHOUT ANY WARRANTY; without even the implied 
    warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  
    See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Philosophy.  
    If not, see <http://www.gnu.org/licenses/>

*/

// chomp
function chomp(text)
{
   // Check for empty
   if (text.search(/\S/) === -1)
   {
      return "";
   }
   else
   {
      // Chomp it.  Yes, I worked that out for fun.
      return text.replace(/^\s*((\S+\s+)*?\S+)\s*$/, "$1");
   }
}

// Add an implication
function add_implication()
{
   new_arrow("implies");
}

// Add a new arrow
function new_arrow(name)
{
   // Find the arrow
   var arrow = phil[name];

   // Draw the arrow
   Joint({x: 100, y: 100}, {x:200, y: 200}, arrow).registerForever(phil.thought_elements);
}

// Initializes the editor
// Takes the editor element and the width the element should be, and the state
function Editor(editor, ew, state)
{
   // Hold on to the state
   this.state = state;

   // Set the style for the editor.
   this.editor = $("#" + editor).css({float: "left", width: ew});

   // A widget for creating a new thought
   this.new_thought = function()
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

      // Me
      var me = this;
      
      // Add a new thought
      function add_thought()
      {
         // Chomp the input
         var val = chomp($(inp).val());
         // Check for valid thought
         if (val.length > 0)
         {
             // Create a new thought with that name
            var thought = new Thought(val, {thinker: "", text: ""});
            // Run the computation to draw the thought.
            var drawA = thought.draw(300, 300);
            drawA(me.state);
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

      // Button to create new implication arrow
      var implies = document.createElement("input");
      $(implies).attr("type", "button");
      $(implies).val("Implication");
      $(implies).click(add_implication);

      $(box).append(implies);

      // Return the editor element
      return box;
   }

   // Reset the editor back to its original state.
   this.reset = function()
   {
      $(this.editor).empty();
      $(this.editor).append(this.new_thought());
      return this.editor;
   }

   // Display the thought itself
   function thought_title(thought)
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
   function edit_box(thought, field)
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
   this.destroy = function(thought)
   {
      // me
      var me = this;

      // Destroy the thought
      function destroyer(e)
      {// Only proceed if you're sure
         if (confirm("Are you sure you want to un-think this thought?"))
         {
            // Delete the thought
            thought.unthink();
            // Clean the editor
            me.reset();
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
   this.edit = function(thought)
   {
      // Get a clean editor
      var editor = this.reset();

      // Print the title of the thought
      $(editor).append(thought_title(thought));

      // Edit fields 
      for(var detail in thought.details)
      {
         $(editor).append(edit_box(thought, detail));
      }

      // A button to destroy the idea
      $(editor).append(this.destroy(thought));
   }

   // Reset the editor
   this.reset();
}

