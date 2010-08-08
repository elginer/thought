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
      // Turn off ghosting for quicker dragging.
      this._opt.ghosting = true;
      this.p = properties;
      this.p.radius = 70;
      this.p.x_offset = this.p.radius / 2;
      this.p.y_offset = (this.p.radius / 2) + 15;

      // Get the label
      var label = this.label();

      // The circle for our thought
      // Note: you *need* to give it a fill colour if you want to drag it without clicking on the text or the circle itself
      var circ = this.paper.circle(this.p.x, this.p.y, this.p.radius).attr("fill", "white");
      // Allow the details to be edited when the circle is clicked
      ElementA(circ.node).then(EventA("mousedown")).then(EditA(this.p.owner, this.p.state)).then(Repeat).repeat().run();
      this.setWrapper(circ);
      // Add a label
      this.addInner(label);
      // Add a button for editing this
      this.addInner(this.edit());
   },

   // Make the text monospace and bigger
   edit_attrs: function(t)
   {
      t.attr("font", "courier").attr("font-family", "monospace").attr("font-size", "15");
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
      var la = this.paper.text(bb.x, bb.y, this.p.label),
      // Apply a text theme
      this.label_attrs(la);
      return la;
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
         this.element.liquidate();
      }
      delete this;
   }
}

// Thought is a visual philosophy
Thought.prototype = new VisualPhilosophy;
