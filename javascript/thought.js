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

// An abstract philosophical object that can be drawn
function VisualPhilosophy()
{
   // Draw the element
   this.draw = function(args)
   {  // me
      var me = this;

      var top_args = arguments;

      // Draw
      function ddraw(state)
      {
         return Pair(state, me.create_element(state, top_args));
      }
      // Return the computation that draws
      return ddraw;
   }
}

var phil = Joint.dia.philosophy = {};

// Implication arrows
phil.implies = {
   startArrow: {type: "none"},
   endArrow: {type: "basic", size: 5},
   attrs: {"stroke-dasharray": "none"}
};

// If and only if arrows
phil.iff = {
   startArrow: {type: "basic", size:5},
   endArrow: {type: "basic", size: 5},
   attrs: {"stroke-dasharray": "none"}
};

// Not implies arrows
phil.implies_not = {
   startArrow: {type: "none"},
   endArrow: {type: "basic", size: 5},
   attrs: {"stroke-dasharray": "none"},
   label: "!"
};

// Collection of thought elements
phil.thought_elements = [];

// A Thought element for Joint
phil.Thought = Joint.dia.Element.extend(
{
   object: "Thought",
   module: "phil",
   init: function(properties)
   {
      // Edit some undocumented options *sigh*
      // Turn off the toolbox
      this._opt.toolbox = false;
      // Turn on ghosting for quicker dragging.
      this._opt.ghosting = true;
      this.p = properties;
     
      // Store this thought in the collection, save our index.
      this.num = phil.thought_elements.push(this) - 1;
 
      var
      // Get the label
      label = this.label(),
      
      // The label's bounding box
      labb = label.getBBox(),

      // Get the edit button
      edit = this.edit(),

      // The editor's bounding box
      edbb = edit.getBBox(),

      // The radius
      radius = 0;

      // The circle's center is in the center of the text
      circle_x = labb.x + (labb.width / 2),
      circle_y = labb.y + ((labb.height + edbb.height + (labb.y - edbb.y)) / 2) + 5;

      // Find the circle's radius 
      if (edbb.width > labb.width)
      {
         radius = (edbb.width / 2) + 15;
      }
      else
      {
         radius = (labb.width / 2) + 15;
      }

      // The circle for our thought
      // Note: you *need* to give it a fill colour if you want to drag it without clicking on the text or the circle itself
      circ = this.paper.circle(circle_x, circle_y, radius).attr("fill", "white");

      this.setWrapper(circ);
      // Add a label
      this.addInner(label);
      // Add an edit button
      this.addInner(edit);
   },

   // An edit button
   edit: function()
   {
      // Create the text
      var 
      edit = this.paper.text(this.p.x, this.p.y + 20, "Edit"),
      props = this.p;  
      // Apply a text theme
      this.edit_attrs(edit);

      // Allow the details to be edited when the edit button is clicked
      $(edit.node).click(function(){props.state.editor.edit(props.owner);})
      return edit;
   },

   // Make the text bigger and sans
   edit_attrs: function(t)
   {
      t.attr("font", "courier").attr("font-family", "monospace").attr("font-size", "15").attr("stroke", "blue");
   },

   // Make the text bigger and sans
   label_attrs: function(t)
   {
      t.attr("font", "arial").attr("font-family", "sans").attr("font-size", "15");
   },

   // Create the label for the box
   label: function()
   {
      // Create the text
      var la = this.paper.text(this.p.x, this.p.y, this.p.label);
      // Apply a text theme
      this.label_attrs(la);
      return la;
   },

   // Destroy this element
   die: function ()
   {
      // Delete this from the collection of thought elements
      phil.thought_elements.splice(this.num, 1);

      // Liquidate
      this.liquidate();
   }

});

// A Thought object.
// Takes a string, the thought and an object describing the thought.
// Must have member 'thought'
function Thought(thought, dets)
{
   // Save the details
   this.details = dets;

   // Hold that thought
   this.thought = thought;

   // Draw this thought on to Joint
   // Takes x and y coordinates and a radius.
   // Returns a computation that produces a Joint element.
   this.create_element = function(state, pos)
   {
      this.element = phil.Thought.create({state: state,
                                          owner: this, 
                                          x: pos[1], 
                                          y: pos[0],
                                          label: this.thought});
   }

   // Unthink this thought
   this.unthink = function()
   {
      if (this.element)
      {
         this.element.die();
      }
      delete this;
   }
}

// Thought is a visual philosophy
Thought.prototype = new VisualPhilosophy;
