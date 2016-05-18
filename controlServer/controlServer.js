var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});





io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});

io.on('connection', function(socket){
    socket.on('click_function', function(msg){
        console.log('game_control_data: ' + msg);
    });
});


io.on('connection', function(socket){
    socket.on('click_function', function(msg){
        io.emit('game_control_data', {"pressedKey":msg});
    });
});

http.listen(3030, function(){
    console.log('listening on *:3030');
});