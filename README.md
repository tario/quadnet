* GAME UNDER CONSTRUCTION *

This project will be a remake of the classical game named "Quadnet" (http://www.martinmagnusson.com/games/quadnet/) using new technologies of web mainly WebGL, if you want to play the original, use DosBOX, it's still a wonderful and addictive game

= Possible Dependencies

These are the possible dependencies, as well as the project grows maybe other dependencies will be added for sound, social networks, etc...

* Three.js (http://threejs.org/) 
* jQuery (http://jquery.com/)

= Development plan

* A test cube in the middle of anything
* Camera controls using the mouse
* Rudimentary versions of four main game meshes, no ligthing
  - Ship (a triangle)
  - Asteroids (grey spheres)
  - Grid (a square)
  - Bullets (white spheres)
* Build scene, at first will be the grid seen from above and black background, no lighting
* Game logic, includes "physics" and ship control/shooting
* Camera movements, including lurch and following the ship in angle
* Rudimentary menu, allowing to start the game and showing credits

* FIRST PLAYABLE VERSION (No music, no sound, no explosions)

* Definitive versions of four main game meshes, with phong lighting
  - Ship (two triangles)
  - Asteroids (sprites)
  - Grid (10x10 board rendered with 10 vertical and 10 horizontal straight lines)
  - Bullets (still white spheres, but with minimal vertex count for performance)
* Explosion effects for asteriods and ship, made using "particles"
* Another effects: flashes on explosions, big points on screen, etc...
* Definitive version of menu, including highscores (highscores will be stored local)
* Sounds (shooting, asteriod explosions)
* Music
* Twitter button
