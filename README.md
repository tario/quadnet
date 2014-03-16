GAME UNDER CONSTRUCTION

![Screenshot of game in current development state](http://i6.minus.com/jbjR6SZDrEBl25.jpg)

This project is a a remake of the classical game named "Quadnet" (http://www.martinmagnusson.com/games/quadnet/) using new technologies of web mainly WebGL, if you want to play the original, use DosBOX, it's still a wonderful and addictive game

Play the game (bata): http://tario.github.io/quadnet/

## Dependencies

* Three.js (http://threejs.org/) 
* Promise.js
* Firebase.js

## Development plan

* A test cube in the middle of anything DONE
* Camera controls using the mouse DONE
* Rudimentary versions of four main game meshes, phong materials DONE
  - Ship (a triangle) DONE
  - Asteroids (grey spheres) DONE
  - Grid (a square) DONE
  - Bullets (white spheres) DONE
* Build scene, at first will be the grid seen from above and black background, directional lighting DONE
* Camera movements, including lurch and following the ship in angle DONE
* Game logic, includes "physics" and ship control/shooting DONE
* Collisions and scores
* Rudimentary menu, allowing to start the game and showing credits DONE

* FIRST PLAYABLE VERSION DONE

* Definitive versions of four main game meshes, with phong lighting DONE
  - Ship (two triangles) DONE
  - Asteroids (grey spheres with normal map) DONE
  - Grid (10x10 board rendered with 10 vertical and 10 horizontal straight lines) DONE
  - Bullets (still white spheres, but with minimal vertex count for performance) DONE
* Explosion effects for asteriods and ship, made using "particles" DONE
* Another effects: flashes on explosions, big points on screen, etc... DONE
* Definitive version of menu, including highscores (highscores will be stored local) DONE
* Sounds (shooting, asteriod explosions) DONE
* Music DONE
* Twitter button DONE
* Facebook button DONE
* Leaderboard stored and synchronized on the cloud DONE
