var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = process.env.PORT || 3000;

// app.get('/chat', (req, res) => {
//   res.sendFile(__dirname + '/index.html');
// });

var Players = [];

class Player {
  constructor(id, nick, skin, position) {
    this.id = id;
    this.nick = nick;
    this.skin = skin;
    this.index = Players.length;
    this.position = position;
    this.life = 100;
    this.kills = 0;
  }
  getId() {
    return { id: this.id };
  }
  getNick() {
    return { nick: this.nick };
  }
  getSkin() {
    return { skin: this.skin };
  }
  getIndex() {
    return { index: this.index };
  }
  getPosition() {
    return { position: this.position };
  }
  getLife() {
    return { life: this.life };
  }
  getKills() {
    return { kills: this.kills };
  }
}


const SPAWN_POSITIONS = [
  { "x": 12, "y": 14 },
  { "x": 13, "y": 14 },
  { "x": 14, "y": 14 },
  { "x": 15, "y": 14 },
  // { "x": 52, "y": 29 },
  // { "x": 60, "y": 7 },
  // { "x": 58, "y": 18 },
  // { "x": 38, "y": 8 },
  // { "x": 40, "y": 15 },
  // { "x": 44, "y": 21 },
];

function createPlayer(message) {
  console.log("CREATE PLAYER: ", message)
  let player = new Player(Players.length, message.data.nick, message.data.skin, SPAWN_POSITIONS[Math.floor(Math.random() * SPAWN_POSITIONS.length)]);
  console.log("PLAYER CREATED: ", player.nick)
  Players.push(player);
  console.log("AVAILABLE PLAYERS: ", Players)
  return player;
}

// function removePlayer(message) {
//   let duplicates = Players.filter(player => message.data.nick == player.nick);
//   duplicates.forEach(function (player) {
//     delete Players[player.id];
//     let playerLeaved = {
//       "action": "PLAYER_LEAVED",
//       "data": {
//         "nick": player.nick,
//         "id": player.id,
//       },
//       "error": false,
//       "msg": ""
//     }
//     console.log("MESSAGE - playerLeaved:: ", playerLeaved);
//     socket.broadcast.emit('message', playerLeaved);
//   })

// }

// function existsNick(nickPlayer) {
//   let lReturn = false;
//   if (Players.length > 0) {
//     Players.forEach(function (player) {
//       console.log("DOES NICK EXIST? ", player.nick, nickPlayer)
//       if (player.nick.toLowerCase() == nickPlayer.toLowerCase()) {
//         lReturn = true;
//         return;
//       }
//     })
//   }
//   return lReturn;
// }

io.on('connection', async function (socket) {

  // console.log("Connected socket:: ", socket);

  let p_id = 9999999;

  socket.on("JOIN_ROOM", (roomID, nickname) => {

    //join in a room of roomID
    socket.join(roomID);
    io.to(roomID).emit("RECEIVE_MESSAGE", "[" + nickname + "]" + " joined room");
    console.log("PLAYER JOINED: [ " + roomID + " | " + nickname + " ]");

    //Leave the room if the user closes the socket
    socket.on('disconnect', () => {

      io.to(roomID).emit("RECEIVE_MESSAGE", "[" + nickname + "]" + " left");
      socket.leave(roomID)
      console.log("PLAYER LEAVED: [ " + roomID + " | " + nickname + " ]");

      

      let playerLeaved = {
        "action": "PLAYER_LEAVED",
        "data": {
          "nick": nickname,
          "id": p_id,
        },
        "error": false,
        "msg": ""
      }
      socket.in(roomID).broadcast.emit('message', playerLeaved);
      delete Players[p_id];
    });

    // Receive a message from socket in a particular room
    socket.on('SEND_MESSAGE', (room, nickname, content) => {
      //Send message to only that particular room
      socket.in(room).emit('RECEIVE_MESSAGE', room, nickname, content);
      console.log("MESSAGE: [ " + room + " | " + nickname + " ]==> " + content);
    })
  });


  socket.on('message', function (message) {

    switch (message.action) {

      //* ******************* *//
      case 'CREATE':

        let playerCreated = createPlayer(message);

        let player = {
          "action": "PLAYER_JOIN",
          "data": {
            "nick": playerCreated.nick,
            "skin": playerCreated.skin,
            "id": playerCreated.id,
            "position": playerCreated.position,
            "playersON": Players
          },
          "error": false,
          "msg": ""
        }

        p_id = player.data.id;
        io.to(message.room).emit('message', player);
        playerCreated = null;


        break;

      //* ******************* *//
      case 'MOVE':
        let playerMove = {
          "action": "MOVE",
          "time": message.time || "",
          "data": {
            "player_id": message.data.player_id,
            "direction": message.data.direction,
            "position": {
              "x": message.data.position.x,
              "y": message.data.position.y
            }
          },
          "error": false,
          "msg": ""
        }
        // Updating the player's position
        if (Players[message.data.player_id])
          Players[message.data.player_id].position = message.data.position;

        console.log("PLAYER MOVE [" + Players[message.data.player_id].nick + "]: ", "ROOM-ID: " + message.room);
        socket.in(message.room).broadcast.emit('message', playerMove);
        break;

      //* ******************* *//
      case 'ATTACK':
        let playerAttack = {
          "action": "ATTACK",
          "time": message.time || "",
          "data": {
            "player_id": message.data.player_id,
            "direction": message.data.direction,
            "position": {
              "x": message.data.position.x,
              "y": message.data.position.y
            }
          },
          "error": false,
          "msg": ""
        }
        console.log("PLAYER ATTACK [" + Players[message.data.player_id].nick + "]: ", "ROOM-ID: " + message.room);
        socket.in(message.room).broadcast.emit('message', playerAttack);
        break;

      //* ******************* *//
      case 'RECEIVED_DAMAGE':
        let playerDamage = {
          "action": "RECEIVED_DAMAGE",
          "time": message.time || "",
          "data": {
            "player_id": message.data.player_id,
            "player_id_attack": message.data.player_id_attack,
            "damage": message.data.damage
          },
          "error": false,
          "msg": ""
        }

        Players[message.data.player_id].life -= message.data.damage;

        if (Players[message.data.player_id].life <= 0)
          Players[message.data.player_id_attack].kills += 1;

        console.log("PLAYER DAMAGE [" + Players[message.data.player_id].nick + "]: ", "ROOM-ID: " + message.room);
        socket.in(message.room).broadcast.emit('message', playerDamage);
        break;
    }

    // // User Disconnected
    // socket.on('disconnect', function (connection) {
    //   console.log('DISCONNECT: ', connection);
    //   let playerLeaved = {
    //     "action": "PLAYER_LEAVED",
    //     "data": {
    //       "nick": message.data.nick,
    //       "id": message.data.player_id,
    //     },
    //     "error": false,
    //     "msg": ""
    //   }



    //   io.to(message.room).emit("RECEIVE_MESSAGE", "[" + message.data.nick + "]" + " left");
    //   socket.leave(message.room)



    //   console.log("PLAYER LEAVED [" + message.data.nick + "]: ", "ROOM-ID: " + message.room);
    //   socket.in(message.room).broadcast.emit('message', playerLeaved);
    //   delete Players[message.data.player_id];
    // });

  });

});

http.listen(port, function () {
  console.log('Mountain Fight on *:' + port);
});
