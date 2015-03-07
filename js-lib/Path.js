(function () {
function Path(arg) {
	if (typeof arg == "string") this._parts = arg.split(/\\|\//g);
	else this._parts = arg.slice();
}
Path.currentDirectory = function () {
	return new Path(shell.CurrentDirectory);
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
Pp.clone = function (str) { return new Path(this._parts); };
Pp.parent = function () { var p = this.clone(); p._parts.pop(); return p; };
Pp.join = function (path) { return new Path(this._parts.concat(path._parts)); };
Pp.add = function (piece) { return this.join(new Path(piece)); };
Pp.toString = function () { return this._parts.join('\\'); };
Pp.last = function () { return this._parts[this._parts.length - 1]; };
Pp.removePrefix = function (pre) {
	assert(pre._parts.length <= this._parts.length, "Cannot remove prefix longer than self!");
	for (var i = 0; i < pre._parts.length; i++) {
		var preP = pre._parts[i], thisP = this._parts[i];
		assert(preP === thisP, "Prefix mismatch '" + preP + "' '" + thisP + "'"); 
	}
	return new Path(this._parts.slice(pre._parts.length));
}
Pp.removeSuffix = function (suf) {
	var di = this._parts.length - suf._parts.length;
	assert(di >= 0, "Cannot remove suffix longer than self!");
	for (var i = 0; i < suf._parts.length; i++) {
		var sufP = suf._parts[i], thisP = this._parts[i + di];
		assert(sufP === thisP, "Suffix mismatch '" + sufP + "' '" + thisP + "'");
	}
	return new Path(this._parts.slice(0, di));
}
Pp.fileExists = function () { return fs.FileExists(this.toString()); };
Pp.folderExists = function () { return fs.FolderExists(this.toString()); };

return Path;
})();