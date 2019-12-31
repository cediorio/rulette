/* Nodes are of type 'op'{erator} or 'prop'{osition}
 */
export class Graph {
    constructor(args = {name: ''}) {
	this._name = args.name;
	this._adjList = {};
    }

    get name() {
	return this._name;
    }

    set name(value) {
	this._name = value;
    }

    get nodeNames() {
	return Object.keys(this._adjList);
    }
    
    createNode( args = {name: null, nodeType: null, value: null} ) {
	args['nodeNames'] = this.nodeNames;
	// console.log(`from createNode: this.nodeNames = ${'test' in args.nodeNames}`);
	let n = new Node(args);
	this._addNode(n);
	return n;
    }
    
    _addNode(node) {
	this._adjList[node.name] = [];
    }

    addEdge( vertex1, vertex2 ) {
    	if ( typeof vertex1 !== 'undefined' && typeof vertex2 !== 'undefined' ) {
    	    this._adjList[vertex1.name].push(vertex2.name);
    	}
    	else {
    	    throw new Error("addEdge requires two nodes/vertices to create an edge");
    	}
    }
    
    get adjList() {
	return this._adjList;
    }

    evalNode( args = {n:n, recStack: recStack, adjList: adjList} ) {
	if (args.n.value) return true;
	if (typeof recStack === 'undefined') recStack = adjList[args.n];
	// console.log(`adjList contents: ${adjList[args.n]}`);
	return recStack;
    }

    dfs() {
	const nodes = this.nodeNames;
	const visited = {};
	nodes.forEach( node => {
	    this._dfsUtil( node, visited);
	});
    }

    _dfsUtil(node, visited) {
	if ( !visited[node] ) {
	    visited[node] = true;
	    const neighbours = this.adjList[node];
	    // console.log(`node: ${node}\nvisited: ${visited[node]}\nneighbours: ${neighbours}`);
	    if( typeof neighbours !== 'undefined' ) {
		neighbours.forEach( i => {
	    	    const neighbour = neighbours[i];
	    	    this._dfsUtil(neighbour, visited);
		});
	    }
	}
    }

    detectCycle() {
	const graphNodes = this.nodeNames;
	const visited = {};
	const recStack = {};
	// console.log(typeof graphNodes);
	graphNodes.forEach( node => {
	    if (this._detectCycleUtil( node, visited, recStack))
		return 'CYCLE EXISTS';
	});

	return 'NO CYCLE EXISTS';
    }

    _detectCycleUtil(node, visited, recStack) {
	if ( !visited[node] ) {
	    visited[node] = true;
	    recStack[node] = true;
	    const nodeNeighbours = this.adjList[node];
	    if ( typeof nodeNeighbours !== 'undefined' ) {
		nodeNeighbours.forEach( currentNode => {
		    // console.log(`parent: ${node}, Child: ${currentNode}`);
		    if(!visited[currentNode] && this._detectCycleUtil(currentNode, visited, recStack)) {
			return true;
		    } else if ( recStack[currentNode] ) {
			return true;
		    }
                });
	    }
	}
	recStack[node] = false;
	return false;
    }
}

export class Node {
    constructor( args = {name: null, nodeType: 'prop', value: null, nodeNames: []})  {
	let {name, nodeType, value, nodeNames} = args;
	// console.log(`from Node constructor: length of nodeNames = ${nodeNames.length}`);
	if ( typeof name !== 'undefined' ) this.name = name;
	else {
	    this.name = _uniqueName(nodeNames);
	}
	this.nodeType = args.nodeType === 'op' ? 'op' : 'prop';
	this.value = typeof value !== 'undefined' ? value : false;
    }
}

const _uniqueName = ( takenNames ) => {
    let proposedName = _defaultName();
    if ( typeof takenNames === 'undefined' || takenNames.length < 1 ) return proposedName;
    else if ( proposedName in takenNames ) _uniqueName( takenNames );
    else return proposedName;
};

const _defaultName = () => {
    // get a random char number between 65 to 122
    // thx to https://stats.stackexchange.com/questions/281162/scale-a-number-between-a-range
    let randomWordLen = 10;
    let charNum = (e) => {
	const rMin = 0, rMax = 1, tMin = 97, tMax = 122; // 97 to 122 is 'a' to 'z'
	return String.fromCharCode( parseInt( ((e - rMin)/(rMax - rMin)) * (tMax - tMin) + tMin ) );
    };
    var name = '';
    for(let i=0; i < randomWordLen; i++) {
	name += charNum(Math.random());
    }

    return name;
};
