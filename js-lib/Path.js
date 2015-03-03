(function () {
function Path(arg) {
	if (typeof arg == "string") this.init(arg);
	else this._parts = arg.slice();
}
Path.findSvnRoot = function() {
	function isSvnRoot(path) {
		var maybe = path.add('.svn').toString();
		return fs.FolderExists(maybe);
	}
	var path = new Path(shell.CurrentDirectory);
	while (!isSvnRoot(path)) {
		var parent = path.parent();
		if (parent.toString() == path.toString()) {
			throw new Error("Not in a subversion repository!");
		}
		path = parent;
	}
	return path;
}
var Pp = Path.prototype;
Pp.init = function (str) { this._parts = str.split('\\'); };
Pp.clone = function (str) { return new Path(this._parts); };
Pp.parent = function () { var p = this.clone(); p._parts.pop(); return p; };
Pp.join = function (path) { return new Path(this._parts.concat(path._parts)); };
Pp.add = function (piece) { return this.join(new Path(piece)); };
Pp.toString = function () { return this._parts.join('\\'); };
Pp.last = function () { return this._parts[this._parts.length - 1]; };
Pp.fileExists = function () { return fs.FileExists(this.toString()); };
Pp.folderExists = function () { return fs.FolderExists(this.toString()); };
return Path;
})();