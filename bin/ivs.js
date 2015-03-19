function require(path) { return WScript.CreateObject("Scripting.FileSystemObject")
		.OpenTextFile("C:\\UnxUtils\\js-lib\\" + path + ".js", 1).ReadAll(); }
		
eval(require("Globals"));
var Chain = eval(require("Chain"));
var Path = eval(require("Path"));

function Cmd(cmdLine) { this._cmdLine = cmdLine; }
var Cmdp = Cmd.prototype;
Cmdp.each = function (cb) {
	var cmd = shell.Exec(this._cmdLine);
	while (!cmd.StdOut.AtEndOfStream) cb(cmd.StdOut.ReadLine());
	while (!cmd.StdErr.AtEndOfStream) writeLine('stderr: ' + cmd.StdErr.ReadLine());
	if (cmd.ExitCode !== 0) writeLine('Exit code: ' + cmd.ExitCode);
};

function writeLine(line) { WScript.StdOut.Write(line + "\n"); }
function /*filter*/blankLines(line) { return line.trim().length > 0; }

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
	new Chain(new Cmd(Path.findSvnRoot().add("src").add("post-update.bat")))
		.filter(blankLines).each(writeLine);
}
function status() {
	// Print the branch if it's different than dev.
	var root = Path.findSvnRoot();
	var cur = Path.currentDirectory();
	var relativeUrl = new Path(new Chain(new Cmd("svn info"))
		.filter(function (line) { return line.startsWith("Relative"); })
		.map(function (line) { return line.split(":")[1].trim(); })
		.value()[0]);
	var branch = relativeUrl.removeSuffix(cur.removePrefix(root));
	if (branch != "^\\intents\\branches\\dev") writeLine("On branch '" + branch + "'");
	
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
function diff() {
	new Chain(new Cmd("svn diff")).each(writeLine);
	//new Chain(new Cmd("svn diff | cat")).each(writeLine);
}
function commit() { shell.Exec("TortoiseProc /command:commit /path:."); }
function browse() { shell.Exec("TortoiseProc /command:repobrowser"); }
function squeaky() { shell.Exec("TortoiseProc /command:cleanup /path:."); }

var commands = {status: status, st: status,
	squeaky: squeaky, sq: squeaky,
	update: update, up: update,
	diff: diff, d: diff,
	commit: commit, ci: commit,
	browse: browse, bo: browse};
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
	var commandName = args[0];
	var command = commands[commandName];
	return function () {		
		if (typeof command === 'undefined') {
			new Chain(new Cmd('svn ' + args.join(' '))).each(writeLine);
		} else if (typeof command === 'function') {
			commands[commandName](args.slice(1));
		} else {
			throw "Internal error with commandName '" + commandName
				+ "', value '" + command.toString + "'";
		}
	}
}
parseArgs()();