var Quadnet = Quadnet||{};
Quadnet.highscore=Quadnet.highscore||(function(){

  var createChangeCallback = function(cb, newscore) {
    return function(snapshot) {
      var array = [];
      var value = snapshot.val();
      if (newscore) {
        array.push({score: newscore, shouldInputName: true});
      }

      for (key in value) {
        var obj = value[key];
        array.push({name: obj.name, score: obj.score});
      } 

      cb(array.sort(function(x,y){ return y.score - x.score; }));
    }
  };

  var highscoreFirebase = function() {
    return new Firebase("https://scorching-fire-8890.firebaseio.com/highscores");
  };

  return {
    oneChangedAll: function(cb, newscore) {
      var firebase = highscoreFirebase();
      firebase.once("value", createChangeCallback(cb, newscore));
    },

    onChangedAll: function(cb, newscore) {
      var firebase = highscoreFirebase();
      firebase.on("value", createChangeCallback(cb, newscore));
    },

    shouldEnterHighscore: function(newscore, yes, no) {
      var firebase = highscoreFirebase();
      firebase.once("value", function(snapshot) {
        var array = [];
        var entries = 0;
        var value = snapshot.val();
        for (key in value) {
          entries++;
          var obj = value[key];
          var score = obj.score;
          if (newscore > score) {
            yes();
            return;
          }
        }

        (entries < 10 ? yes : no)();
      });
    },

    insert: function(name, score) {
      var firebase = highscoreFirebase();
      firebase.push({name: name, score: score});
    }
  };
})();

