var Quadnet = Quadnet||{};
Quadnet.highscore=Quadnet.highscore||(function(){
  var scoresArray = [];

  var highscoreFirebase = function() {
    return new Firebase("https://scorching-fire-8890.firebaseio.com/highscores");
  };

  return {
    oneChangedAll: function(cb, newscore) {
      var newArray = scoresArray;
      if (newscore) {
        newArray = scoresArray.slice(0);
        newArray.push({score: newscore, shouldInputName: true});
        newArray = newArray.sort(function(x,y){ return y.score - x.score; });
      }

      cb(newArray);
    },

    onChangedAll: function(cb) {
      var firebase = highscoreFirebase();
      firebase.on("child_added", function(newData) {
        scoresArray.push({name: newData.val().name, score: newData.val().score});
        scoresArray = scoresArray.sort(function(x,y){ return y.score - x.score; })
        cb(scoresArray);
      });
    },

    shouldEnterHighscore: function(newscore, yes, no) {
      if (scoresArray.length < 10) {
        yes(); return;
      }

      for (var i=0; i<scoresArray.length; i++) {
        if (newscore > scoresArray[i].score) {
          yes(); return;
        }
      }

      no();
    },

    insert: function(name, score) {
      var firebase = highscoreFirebase();
      firebase.push({name: name, score: score});
    }
  };
})();

