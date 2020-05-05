var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = process.env.PORT || 3000;

// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/index.html');
// });

// -----------------------------------------------------------
// List of all players
// -----------------------------------------------------------
var Players = [];

function Player(id, name){
    this.id = id;
    this.name = name;
    this.index = Players.length;
}

Player.prototype = {
    getId: function(){
        return {id: this.id, };
    }
};

function createPlayer(message) {
      console.log("CREATE PLAYER: ", message)
      let player = new Player(Players.length, message.nick);
      Players.push(player);
      console.log("PLAYERS DISPONÍVEIS: ", Players)
      player = null;
}

function existeNick(nickPlayer) {

  if(Players.length > 0) {

    Players.forEach(function(nick) {
      if(Players.includes(message.nick)) {
       
        client.on('message',error);
      }

    })

  }

  return false;

}

io.on('connection', function(client) {

  console.log("Cliente conectado:: ", client);

    client.on('message', function(message) {

      switch(message.action){
        case 'CREATE':

          if(!existeNick(message.nick)) {
            createPlayer(message);
          } else {
            let error = {
              "action":"CREATE",
              "error": true,
              "msg":"Nick de usuário já existe"
            }
            client.on('message',error);
          }

          let playerCreated = {
            "action": "PLAYER_JOIN",
            "data":  {
                "nick": message.data.nick,
                "skin": message.data.skin,
                "id": Players[0].id,
                "position": {
                  "x": 12,
                  "y": 10
                }
            },
            "error": false,
            "msg":""
          }
          io.emit('message', playerCreated);
          break;

        case 'MOVE':
          let playerMove = {
            "action": "MOVE",
            "data":  {
                "player_id": message.data.player_id,
                "direction": message.data.direction,
            },
            "error": false,
            "msg":""
          }
          io.emit('message', playerMove);

          break;
      }

    });

  
  });

  // user disconnected
  io.on('close', function(connection) {
    // We need to remove the corresponding player
    // TODO
  });





http.listen(port, function(){
  console.log('Mountain Fight on *:' + port);
});
