var Quadnet = Quadnet||{};
Quadnet.highscore=Quadnet.highscore||(function(){
  var highscoreMaxEntries = 10;
  var highscoreData;;
  var load = function(){
    var highscoreString = window.localStorage.getItem("quadnet-highscores");
    if (highscoreString) {
      highscoreData = JSON.parse(highscoreString);
    } else {
      highscoreData = [];
    }
  };
  var save = function() {
    window.localStorage.setItem("quadnet-highscores", JSON.stringify(highscoreData));
  };

  load();
  return {
    getAllForInput: function(newscore) {
      var highscoreInputList = highscoreData.slice(0);
      highscoreInputList.push({score: newscore, shouldInputName: true});
      highscoreInputList = highscoreInputList.sort(function(a,b){return b.score-a.score;}).slice(0,10)
      return highscoreInputList;
    },

    getAll: function() {
      return highscoreData;
    },

    shouldEnterHighscore: function(score) {
      if (highscoreData.length < 10) return true;
      return highscoreData.map(function(x){return score>x.score}).reduce(function(a,b){return a || b});
    },

    insert: function(name, score) {
      highscoreData.push( {name: name, score: score});
      highscoreData = highscoreData.sort(function(a,b){return b.score-a.score;}).slice(0,10);
      save();
    }
  };
})();

