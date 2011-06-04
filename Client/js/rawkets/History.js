/**************************************************
** MOVEMENT HISTORY
**************************************************/

r.namespace("History");
rawkets.History = function() { // Rename to avoid conflict with History API
	var moves = [],
		MAX_MOVES = 1024;
		
	var add = function(move) {
		moves.push(move);
		if (moves.length > MAX_MOVES) {
			moves.shift();
		};
	};
	
	var correction = function(time, state, input, entity, rk4) {
		// Discard old moves (there's probably a better way to do this, but it works)
		var m, moveCount = moves.length, deadMoves = [];
		
		for (m = 0; m < moveCount; m++) {
			if (time > moves[m].time) {
				deadMoves.push(moves[m]);
			};
		};
		
		var dm, deadMoveCount = deadMoves.length;
		for (dm = 0; dm < deadMoveCount; dm++) {
			moves.splice(moves.indexOf(deadMoves[dm]), 1);
		};
		
		// Make sure moves actually exist
		moveCount = moves.length;
		if (moveCount == 0) {
			return;
		};
		
		var lastMove = moves[0],
			firstMove = moves[moveCount-1];
		
		// Check that a relavent move exists within 200ms (otherwise there is a syncing issue) [removed]
		//if ((lastMove.time - time) < 200) {
		// Corrected state is significantly different to move state (at least 2 pixels diff)
		if (Math.abs(state.p.x - lastMove.state.p.x) > 2 || Math.abs(state.p.y - lastMove.state.p.y) > 2 || Math.abs(state.a - lastMove.state.a) > 0.5) {
			//console.log("State delta", deadMoveCount, Math.abs(state.x - lastMove.state.x), lastMove.time, time, lastMove.time - time);
			
			// Remove move as it needs to be corrected
			moves.shift();
			moveCount = moves.length;
			
			// Rewind to the time of correction and replay moves
			var currentTime = time, // Should this replace the actual currentTime variable for the game?
				currentInput = input; // Likewise
			
			console.log("State corrected");
			console.log("Before correction", {p: {x: entity.currentState.p.x, y: entity.currentState.p.y}, a: entity.currentState.a}, {p: {x: state.p.x, y: state.p.y}, a: state.a});
			
			// Rewind entity state
			entity.setState(state);
			
			console.log("Corrected state", {p: {x: entity.currentState.p.x, y: entity.currentState.p.y}, a: entity.currentState.a}, {p: {x: state.p.x, y: state.p.y}, a: state.a});
			
			rk4.accumulator = 0; // Reset accumulator on each pass to prevent corruption from previous simulations
			
			var move, // Current move
				frameTime; // Time between correction and stored move
			for (m = 0; m < moveCount; m++) {
				move = moves[m];
				frameTime = (move.time - currentTime) / 1000;
				
				// Limit frame time to avoid "spiral of death"
				if (frameTime > 0.25) {
					frameTime = 0.25;
				};
				
				// Update physics based on corrected time, input and state
				rk4.accumulator += frameTime; // Should this be reset for each move?
				while (rk4.accumulator >= rk4.dt) {
					rk4.integrate(entity.currentState);

					// Update accumulator
					rk4.accumulator -= Math.abs(rk4.dt); // Absolute value to allow for reverse time
				};
				
				// Update time and input ready for next move
				currentTime = move.time;
				currentInput = move.input;
				
				// Change stored state to new, corrected state
				move.state = entity.getState();
			};
			
			console.log("After correction", {p: {x: entity.currentState.p.x, y: entity.currentState.p.y}, a: entity.currentState.a}, {p: {x: state.p.x, y: state.p.y}, a: state.a});

			// Restore saved input
			//currentInput = currentInputFromGame;
		};
		//};
	};
		
	return {
		add: add,
		correction: correction
	};
};