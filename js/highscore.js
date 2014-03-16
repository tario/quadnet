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
        var score = -parseInt(key);
        for (key2 in obj) {
          array.push({name: obj[key2], score: score});
        }
      } 

      cb(array.sort(function(x,y){ return y.score - x.score; }));
    }
  };

  return {
    oneChangedAll: function(cb, newscore) {
      var firebase = new Firebase("https://scorching-fire-8890.firebaseio.com/highscores");
      firebase.once("value", createChangeCallback(cb, newscore));
    },

    onChangedAll: function(cb, newscore) {
      var firebase = new Firebase("https://scorching-fire-8890.firebaseio.com/highscores");
      firebase.on("value", createChangeCallback(cb, newscore));
    },

    shouldEnterHighscore: function(newscore, yes, no) {
      var firebase = new Firebase("https://scorching-fire-8890.firebaseio.com/highscores");
      firebase.once("value", function(snapshot) {
        var array = [];
        var entries = 0;
        var value = snapshot.val();
        for (key in value) {
          var obj = value[key];
          var score = -parseInt(key);
          for (key2 in obj) {
            entries++;
            if (newscore > score) {
              yes();
              return;
            }
          }
        }

        (entries < 10 ? yes : no)();
      });
    },

    insert: function(name, score) {
      var firebase = new Firebase("https://scorching-fire-8890.firebaseio.com/highscores/-"+score+"/");
      firebase.push(name);
    }
  };
})();

