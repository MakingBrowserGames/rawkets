/**************************************************
** MESSAGE CONTROLLER
**************************************************/

r.namespace("Message");
rawkets.Message = function(socket) {
	// Shortcuts
	var e = r.Event;
	
	// Properties
	var socket = socket;
	
	// Queues
	var incoming = [],
		outgoing = [],
		
	// Types
		types = {
			PING: 1,
			SYNC: 2,
			NEW_PLAYER: 3,
			UPDATE_PLAYER: 4,
			UPDATE_INPUT: 5
		};
	
	// Methods
	var format = function(type, args) {
		if (types[type] == undefined) {
			console.log("Cannot format message", type, args);
			return false;
		};
		
		var msg = {z: types[type]};

		for (var arg in args) {
			// Don't overwrite the message type
			if (arg != "z")
				msg[arg] = args[arg];
		};

		//return JSON.stringify(msg);
		return BISON.encode(msg);
	};
	
	var send = function(msg, immediately) {
		// Send message immediately
		if (msg && immediately) {
			socket.send(msg);
			return;
		};
		
		// Otherwise add message to the queue
		outgoing.push(msg);
	};
	
	var onSocketMessage = function(data) {
		var msg = BISON.decode(data);
		
		if (msg.z !== undefined) {
			// Make this automated so you can refer message type from the received message
			switch (msg.z) {
				case types.PING:
					e.fire("PING", msg);
					break;
				case types.SYNC:
					e.fire("SYNC", msg);
					break;
				case types.NEW_PLAYER:
					e.fire("NEW_PLAYER", msg);
					break;
				case types.UPDATE_PLAYER:
					e.fire("UPDATE_PLAYER", msg);
					break;
			};
		};
	};
	
	var setEventHandlers = function() {
		e.listen("SOCKET_MESSAGE", onSocketMessage);
	};
	
	return {
		format: format,
		send: send,
		setEventHandlers: setEventHandlers
	};
};