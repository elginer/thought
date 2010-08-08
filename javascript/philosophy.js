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

// The philosophy state
function PhilosophyState(diag, editor)
{
   this.thoughts = {};
   this.diagram = "#" + diag;
   this.editor = editor; 
}

// Object for drawing things used in philosophy.
// Takes paper.
// Engage warp drive!
// Takes an element id or an HTML element, and then a width and a height.
// Returns a computations which initializes Joint, and returns a nice interface to the drawing library. 
function philosophy(diagram, editor)
{

   // The screen width, editor width and diagram width
   var 
   width = screen.availWidth * (9.5/10), 
   height = screen.availHeight,
   ew = width / 4
   , dw = width * (3/4);

   var state = new PhilosophyState(diagram, editor);

   // Set up the editor panel
   editor = initialize_editor(editor, ew, state); 

   // Set up the size of the diagram element.
   $("#" + diagram).css({width: dw, "margin-left": ew});
   
   // Initialize the diagramming library
   function Initialize(elem)
   {
      // Initialize Joint
      Joint.paper(elem, dw, height);

      // Return the application state. 
      state.editor = editor;
      return state;
   }

   // Return a computation which initializes the drawing library on the given element.
   return ElementA(diagram).then(Initialize);
}
