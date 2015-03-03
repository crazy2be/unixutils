function require(path) { return WScript.CreateObject("Scripting.FileSystemObject")
		.OpenTextFile("C:\\UnxUtils\\js-lib\\" + path + ".js", 1).ReadAll(); }
		
eval(require("Globals"));
var Chain = eval(require("Chain"));

// TODO: Do something special when commands crash!
function Cmd(cmdLine) {
	this._cmdLine = cmdLine;
}
var Cmdp = Cmd.prototype;
Cmdp.each = function (cb) {
	var cmd = shell.Exec(this._cmdLine);
	while (!cmd.StdOut.AtEndOfStream) {
		var line = cmd.StdOut.ReadLine();
		cb(line);
	}
};

function squeaky() {
	var tortoiseCleanup = "TortoiseProc /command:cleanup /path:.";
	shell.Exec("TortoiseProc /command:cleanup /path:.");
}
function writeLine(line) {
	if (line[line.length - 1] != "\n") WScript.StdOut.Write(line + "\n");
}
function /*filter*/blankLines(line) {
	// http://stackoverflow.com/questions/1418050/string-strip-for-javascript
	return line.replace(/^\s+|\s+$/g, '').length > 0;
}
function update() {
	var externalLine = "";
	new Chain(new Cmd("svn update"))
		.flatMap(function (line) {
			if (line.startsWith("Fetching external item into '")) {
				assert(!externalLine); externalLine = line; return [];
			} else if (line.startsWith("External at revision")) {
				assert(externalLine); externalLine = ""; return [];
			} else if (externalLine !== false) {
				var r = [externalLine, line]; externalLine = false; return r;
			} else return [line];
		}).filter(blankLines).each(writeLine);
	new Chain(new Cmd("src\\post-update.bat")).filter(blankLines).each(writeLine);
}
function status() {
	var externals = {};
	new Chain(new Cmd("svn status")).filter(blankLines).filter(function (line) {
		if (line.startsWith("X")) {
			var external = line.split(" ").slice(-1).pop();
			assert(!externals[external]); externals[external] = true;
			return false;
		} else if (line.startsWith("Performing status on external item at '")) {
			var external = line.split("'")[1];
			assert(externals[external]); externals[external] = false;
			return false;
		} else {
			return true;
		}
	}).each(writeLine);
}

var commands = {status: status, st: status,
	squeaky: squeaky, sq: squeaky,
	update: update, up: update};
function parseArgs() {
	function toArray(wsArgs) {
		var args = [];
		for (var i = 0; i < wsArgs.Length; i++) {
			args[i] = wsArgs.Item(i);
		}
		return args;
	}
	var args = toArray(WScript.Arguments);
	if (args.length < 1) {
		pl("Usage: ivs [command]");
		WScript.Quit(1);
	}
	var command = args[0];
	if (!commands[command]) {
		new Chain(new Cmd('svn ' + args.join(' '))).each(writeLine);
		WScript.Quit(0);
	}
	return function () {
		commands[command](args.slice(1));
	}
}
parseArgs()();