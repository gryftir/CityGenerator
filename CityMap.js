

/* ========================================================================= */
/* build_city is called by CityGenerator to build the city map. We pass in
/* everything via the params object to make things easier.
/* ========================================================================= */

function build_city(  params  ){

    // Step 1) we need to set our seed to ensure consistency
    Math.seedrandom(params.seed)

    var citycanvas=params.canvas

    // hardcoded map sizes
    citycanvas.height=300;
    citycanvas.width=350;

    //Set the total number of cells and the city cell count
    var totalcellcount = 200 + params.size*20 // should range between 150 cells and 440
    var citycellcount  = Math.floor(totalcellcount*(20+params.size)/100);

    // Generate our base CityMap
    var city=new CityMap(  citycanvas.width, citycanvas.height, totalcellcount  );
    // Generate the key parts of the city.
    city.designateCity(citycanvas,citycellcount);
    city.generateCityWalls()
    city.generateDistricts(params.districts);


    // This is ugly, but is the easiest way to pull the city color.
    // From here, draw out all the parts we designated above.
    city.paintBackground(citycanvas,document.map.currentcitycell.color);
    city.drawCoast(citycanvas, params.isport, params.coastdirection)
    city.paintCity(citycanvas)
 
    city.drawCityWalls(citycanvas,  Math.ceil(params.wallheight/10)   )

    city.render(citycanvas)
    city.drawRoads(citycanvas, params.roads, params.mainroads)
}


CityMap.prototype.designateCity = function(canvas,citycellcount){
    this.citycells=[]
    for (var i = 0; i < Math.floor( citycellcount) ; i++) {
        this.citycells.push(this.findCenterCell(canvas))
    }


}



/* ========================================================================= */
/* CityMap is the base object for generating the city map. 
/* TODO This should be abstracted out with WorldMap
/* ========================================================================= */

function  CityMap(width,height,num_points) {
    // Base Parameters
    this.width=width;
    this.height=height;
    this.num_points = num_points;

    // default constant values
    this.num_lloyd_iterations=2;

    // These are important bits to track
    this.voronoi = new Voronoi();

    //First generate points,
    this.generateRandomPoints();

    // then compute the virinoi
    this.buildGraph();
}

CityMap.prototype.paintCity = function(canvas){
    for (var i = 0; i < this.citycells.length; i++) {
        var cell=this.citycells[i];
        this.colorPolygon(cell,canvas,'highlight','rgba(255,255,255,1)',false);
    }
}
CityMap.prototype.generateDistricts = function(districts){
    // rainbows and unicorn farts go here.
}





CityMap.prototype.drawCoast = function(canvas, isport, coastdirection){
    if ( isport ){
        var percentwater= ( 25 + Math.round(Math.random()*15))/100;
        var water=[];
        console.log(this.diagram)
        var targetcount=Math.round( this.diagram.cells.length * percentwater ) -this.citycells.length/2
        while (water.length< targetcount){
    
    
    
            var target={site:{  x:canvas.width/2,  y:canvas.height/2 } }
            var target=this.findCenterCell(canvas)
    
    
    
            for (var i=0 ; i< this.diagram.cells.length; i++){
                var cell=this.diagram.cells[i]
                var tweak=Math.random()*30
                if ( ! cell.incity && ! cell.water){
                    if ( coastdirection=='north'){
                        if ( (  cell.site.y+tweak < target.site.y ) ){
                            target=cell;
                        }
                    }else if ( coastdirection =='south' ){
                        if ( (  cell.site.y+tweak > target.site.y ) ){
                            target=cell;
                        }
                    }else if ( coastdirection =='east' ){
                        if ( (  cell.site.x+tweak > target.site.x ) ){
                            target=cell;
                        }
                    }else if ( coastdirection =='west' ){
                        if ( (  cell.site.x+tweak < target.site.x ) ){
                            target=cell;
                        }
                    } else if ( coastdirection=='northeast'){
                        if ( (  cell.site.y+tweak < target.site.y && cell.site.x+tweak > target.site.x ) ){
                            target=cell;
                        }
                    }else if ( coastdirection =='southeast' ){
                        if ( (  cell.site.y+tweak > target.site.y && cell.site.x+tweak > target.site.x ) ){
                            target=cell;
                        }
                    }else if ( coastdirection =='northwest' ){
                        if ( (   cell.site.y+tweak < target.site.y && cell.site.x+tweak < target.site.x ) ){
                            target=cell;
                        }
                    }else if ( coastdirection =='southwest' ){
                        if (  (  cell.site.y+tweak > target.site.y  && cell.site.x+tweak < target.site.x ) ){
                            target=cell;
                        }
                    }
    
                }
            }
            if (target == null){
                console.log('target was null, no idea why; reduce our goal to prevent infinite loops if things are bad.')
                targetcount-- // something is wrong if this happens
            }else{
                target.water=true
                water.push(target)
            }
        }
        for (var i=0 ; i< water.length; i++){
           this.colorPolygon(water[i],canvas,'highlight','rgba(55,55,222,1)',false);
     
        }
    }
}


CityMap.prototype.findCenterCell = function(canvas){
    var width  = this.width;
    var height = this.height;

    var centerx = width/2;
    var centery = height/2;
    var lesser  = Math.min(width, height);

    var closestpoint;
    var shortestradius=10000;

    for (var i=0; i<this.diagram.cells.length; i++) {
        var cell=this.diagram.cells[i];
        var x = cell.site.x
        var y = cell.site.y
        var randx= (Math.random()*x - x/2)/4
        var randy= (Math.random()*y - y/2)/4


        var adjustedx=x-centerx+randx;
        var adjustedy=y-centery+randy;
        var radius=  Math.sqrt( Math.pow(adjustedx,2) + Math.pow(adjustedy,2));
        if (!cell.incity && !cell.inwater &&    shortestradius> radius ){
            shortestradius=radius
            closestpoint=cell
        }
    }
    closestpoint.incity=true
    return closestpoint
}



CityMap.prototype.generateRandomPoints = function(){
    var points = [];
    var margin=0;
    for (var i=0; i<this.num_points; i++) {
        points.push({
                    x:Math.round((Math.random()*(this.width  -margin*2) )*10)/10 +margin,
                    y:Math.round((Math.random()*(this.height -margin*2) )*10)/10 +margin
                    });
    }
    this.points=points;
}
CityMap.prototype.buildGraph = function(){
    this.diagram = this.voronoi.compute(this.points, {xl:0,xr:this.width,yt:0,yb:this.height });
    this.improveRandomPoints();
}
CityMap.prototype.improveRandomPoints = function(){
    var points=[];
    for (var i = 0; i < this.num_lloyd_iterations; i++) {
        points=[];
        for(cellid in this.diagram.cells) {
            var cell = this.diagram.cells[cellid];
            cell.site.x = 0.0;
            cell.site.y = 0.0;
            var count=0;
            for (hedgeid in cell.halfedges) {
                var he = cell.halfedges[hedgeid];
                var hestart=he.getStartpoint();
                if (hestart.x != NaN && hestart.y != NaN){
                    cell.site.x += hestart.x||0;
                    cell.site.y += hestart.y||0;
                    count++;
                }
                var heend=he.getEndpoint();
                if (heend.x != NaN && heend.y != NaN){

                    cell.site.x += heend.x||0;
                    cell.site.y += heend.y||0;
                    count++;
                }
            }
            var px = parseInt(cell.site.x / count);
            var py = parseInt(cell.site.y / count);
            points.push({x:px,
                        y:py
                        });
        }

        this.voronoi.reset();
        this.points=points;
        this.diagram = this.voronoi.compute(this.points, {xl:0,xr:this.width,yt:0,yb:this.height });
    }
}

/* **************************************************************** */
CityMap.prototype.colorPolygon = function(cell,canvas,mode,color,noborder){
    if (color == null){
        if (mode=='elevation'){  //note that there is a two-tone color difference between land and ocean
            //not intentional, but s exxpected.
                var c= parseInt(Math.floor(cell.elevation*128))*2;
                cell.color= 'rgb(' + c + "," + c + "," + c + ")";
        }else if (mode=='moisture'){
            var c= parseInt(Math.floor(cell.moisture*128))*2;
            cell.color= 'rgb(' + c + "," + c + "," + c + ")";

        }else if (mode=='biomes'){
            if (cell.ocean){
                cell.color=this.getOceanColor(cell);
            }else{
               cell.color=this.terrain[ cell.terrain].color;
            }
        }else if (mode=='land elevation'){
            if ( cell.ocean){
                cell.color=this.getOceanColor(cell);
            }else{
                var c= parseInt(Math.floor(cell.elevation*128))*2; //The closer the elevation is to 0
                cell.color= 'rgb(' + c + "," + c + "," + c + ")";
            }
        }
    }else{
        cell.color=color;
    }
    var polyfill = canvas.getContext('2d');

    polyfill.fillStyle=cell.color;
    polyfill.strokeStyle=cell.color;
    polyfill.beginPath();
    // draw a line for each edge, A to B.
    console.log(cell)
    for (var i=0; i<cell.halfedges.length; i++) {

        var vertexa=cell.halfedges[i].getStartpoint();
        polyfill.lineTo(vertexa.x,vertexa.y);
        var vertexb=cell.halfedges[i].getEndpoint();
        polyfill.lineTo(vertexb.x,vertexb.y);
    }
    //close the path and fill it in with the provided color
    polyfill.closePath();
    polyfill.fill();
    if (!noborder){
        polyfill.stroke();
    }
}


CityMap.prototype.drawRoads = function(canvas,roads,mainroads){
    var corners=[]
    // TODO change this loop to randomly push corners on so
    // that a single road is not always going west.
    for(var i=0; i<this.outline.length; i++){
        corners.push(this.outline[i])
    }
    var roadwidth=3

    for (var i=0; i<roads; i++){
        if (mainroads-->0){
            roadwidth=6
        }else{
            roadwidth=3
        }
        var va= corners[    Math.floor(i/roads*corners.length)     ]
        this.drawRoad(canvas,va,roadwidth);
    }
}



CityMap.prototype.drawRoad = function(canvas,va,roadwidth){
    var road=[va]
    var loop=30

    var focus;
    var minx=Math.min(va.x,canvas.width-va.x);
    var miny=Math.min(va.y,canvas.height-va.y);

    var targetva=null
    var candidatecells=[]
    var cells=this.diagram.cells
    var isdry=true
    if (minx/canvas.width < miny/canvas.height){ // X is closer than Y
        if ( minx == va.x ) {
            while (va.x >0 && isdry ){ //bear west
                for (var i=0; i < cells.length; i++){
                    if ( cells[i].corners.indexOf(va) != -1   ){// va is found on this cell, make it a candidate


                        candidatecells.push(cells[i])
                    }
                }
                for (var i=0; i < candidatecells.length; i++){
                    if (candidatecells[i].water){
                        isdry=false
                        console.log('you hit water!')
                        break
                    }
                    for (var j=0; j < candidatecells[i].halfedges.length; j++){
                        var edge=candidatecells[i].halfedges[j].edge
                        if ( edge.va == va  ){
                            if ( edge.vb.x < va.x){
                                va=edge.vb
                                if (this.outline.indexOf(va) != -1){
                                    road=[]
                                }
                                    road.push(va)
                            }
                        } else if ( edge.vb ==va  ){
                            if ( edge.va.x < va.x){
                                va=edge.va
                                if (this.outline.indexOf(va) != -1){
                                    road=[]
                                }
                                road.push(va)
                            }
                        }
                    }
                }
            }
        }else{
            while (va.x <canvas.width && isdry ){//bear east
                for (var i=0; i < cells.length; i++){
                    if ( cells[i].corners.indexOf(va) != -1   ){// va is found on this cell, make it a candidate
                        candidatecells.push(cells[i])
                    }
                }
                for (var i=0; i < candidatecells.length; i++){
                    if (candidatecells[i].water){
                        isdry=false
                        console.log('you hit water!')
                        break
                    }
                    for (var j=0; j < candidatecells[i].halfedges.length; j++){
                        var edge=candidatecells[i].halfedges[j].edge
                        if ( edge.va == va  ){
                            if ( edge.vb.x > va.x){
                                va=edge.vb
                                if (this.outline.indexOf(va) != -1){
                                    road=[]
                                }
                                road.push(va)
                            }
                        } else if ( edge.vb ==va  ){
                            if ( edge.va.x > va.x){
                                va=edge.va
                                if (this.outline.indexOf(va) != -1){
                                    road=[]
                                }
                                road.push(va)
                            }
                        }
                    }
                }
            }
        }
    }else{    
        if ( miny == va.y ) {
            while (va.y >0 && isdry ){ // bear north
                for (var i=0; i < cells.length; i++){
                    if ( cells[i].corners.indexOf(va) != -1   ){// va is found on this cell, make it a candidate

                        candidatecells.push(cells[i])
                    }
                }
                for (var i=0; i < candidatecells.length; i++){
                    if (candidatecells[i].water){
                        isdry=false
                        console.log('you hit water!')
                        break
                    }
                    for (var j=0; j < candidatecells[i].halfedges.length; j++){
                        var edge=candidatecells[i].halfedges[j].edge
                        if ( edge.va == va  ){
                            if ( edge.vb.y < va.y){
                                va=edge.vb
                                if (this.outline.indexOf(va) != -1){
                                    road=[]
                                }
                                road.push(va)
                            }
                        } else if ( edge.vb ==va  ){
                            if ( edge.va.y < va.y){
                                va=edge.va
                                if (this.outline.indexOf(va) != -1){
                                    road=[]
                                }
                                road.push(va)
                            }
                        }
                    }
                }
            }
        }else{
            while (va.y <canvas.height && isdry ){//bear south
                for (var i=0; i < cells.length; i++){
                    if ( cells[i].corners.indexOf(va) != -1   ){// va is found on this cell, make it a candidate
                        candidatecells.push(cells[i])
                    }
                }
                for (var i=0; i < candidatecells.length; i++){
                    if (candidatecells[i].water){
                        isdry=false
                        console.log('you hit water!')
                        break
                    }
                    for (var j=0; j < candidatecells[i].halfedges.length; j++){
                        var edge=candidatecells[i].halfedges[j].edge
                        if ( edge.va == va  ){
                            if ( edge.vb.y > va.y){
                                va=edge.vb
                                if (this.outline.indexOf(va) != -1){
                                    road=[]
                                }
                                road.push(va)
                            }
                        } else if ( edge.vb ==va  ){
                            if ( edge.va.y > va.y){
                                va=edge.va
                                if (this.outline.indexOf(va) != -1){
                                    road=[]
                                }
                                road.push(va)
                            }
                        }
                    }
                }
            }
        }
    }


    var c = canvas.getContext('2d');

    c.strokeStyle='#5E2605';
    c.lineWidth=roadwidth;
    c.beginPath();
    var originalposition=null
    for (var j=0; j < road.length; j++){
        c.lineTo(road[j].x, road[j].y);
    }
    c.lineCap = 'butt';
    c.stroke()
    this.paintdot(canvas, road[0].x, road[0].y, roadwidth/2,'rgba(100,100,100,.9)') // final gateway

}









CityMap.prototype.paintdot = function(canvas,x,y,radius,color){
    var polyfill = canvas.getContext('2d');

    polyfill.strokeStyle=color;
    polyfill.fillStyle=color;
    polyfill.beginPath();

    polyfill.moveTo(x-radius,y-radius);
    polyfill.lineTo(x+radius,y-radius);
    polyfill.lineTo(x+radius,y+radius);
    polyfill.lineTo(x-radius,y+radius);

    polyfill.closePath();
    polyfill.fill();
    polyfill.stroke();
}

CityMap.prototype.drawCityWalls = function(canvas,wallsize){
    var polyline = canvas.getContext('2d');
    polyline.beginPath();
    for (var i=0; i<this.outline.length; i++){
        var vertex= this.outline[i];
        polyline.lineTo(vertex.x,vertex.y);
    }
    polyline.lineWidth=wallsize;
    //console.log(wallsize)
    polyline.strokeStyle="rgba(0,0,0,0.7)";
    //polyline.fillStyle="rgba(200,0,0,0.3)";
    polyline.fillStyle=this.color;
    polyline.lineCap = 'butt';
    polyline.stroke();
    //    polyline.fill();
    polyline.closePath();

}
// Determine if halfedge has a side that is not in the kingdom list
CityMap.prototype.isKingdomEdge = function(ids,halfedge){
    if (  ids.indexOf( halfedge.edge.lSite.voronoiId) ==-1 || ids.indexOf( halfedge.edge.rSite.voronoiId) ==-1  ){
        return true
    }else{
        return false
    }
}


//TODO refactor with getKingdomPolygon
CityMap.prototype.generateCityWalls = function(){
        var ids=[]
        for (var i=0; i < this.citycells.length ; i++ ){ ids.push(this.citycells[i].site.voronoiId)}
        //Get a list of all external edges
        var edges=[];
        for (var i=0; i < this.citycells.length ; i++ ){
            var cell=this.citycells[i];
            for (var j=0; j < cell.halfedges.length ; j++ ){
                var he=cell.halfedges[j];
                if (  this.isKingdomEdge(ids,he) ){
                    edges.push(he);
                }
            }
        }

        //loop through the edges and push them onto the outline list for drawing later
        var minx=1000000
        var pos;
        for (var i=0; i < edges.length ; i++ ){
            minx=Math.min(minx,edges[i].edge.va.x, edges[i].edge.va.x)
            if (edges[i].edge.va.x == minx){
                pos=edges[i].edge.va
            } else if (edges[i].edge.vb.x == minx){
                pos=edges[i].edge.vb
            }
        }

        this.outline=[pos];
        var maxfail=edges.length;
        while(edges.length >0){
            var testedge=edges.pop()
            if (testedge.edge.va == pos ){
                    pos=testedge.edge.vb;
                    this.outline.push(pos);
                    maxfail=edges.length;
            }else if (testedge.edge.vb == pos ){
                    pos=testedge.edge.va;
                    this.outline.push(pos);
                    maxfail=edges.length;
            }else{
                maxfail--;
                if (maxfail== 0){
                    break;
                }
                edges.unshift(testedge);
            }
        }
        return this;
}



/* **************************************************************** */
/*  render uses the edges from the diagram, then mark the points.
/* **************************************************************** */
CityMap.prototype.render = function(canvas){
    var ctx = canvas.getContext('2d');
   
    //First lets draw all of the edges.
    // This can probably be refactored
    ctx.strokeStyle="rgba(0,0,0,.2)";
    ctx.lineWidth=1;
    ctx.beginPath();
    var edges = this.diagram.edges;
    var iEdge = edges.length;
    var edge, v;
    while (iEdge--) {
        edge = edges[iEdge];
        v = edge.va;
        ctx.moveTo(v.x,v.y);
        v = edge.vb;
        ctx.lineTo(v.x,v.y);
        }   
    ctx.stroke();

    // Now lets draw some red dots at the 
    // point for each cell (note, not the center)
    // This can probably be refactored
    ctx.fillStyle = 'rgba(255,200,200,.2)';
    ctx.beginPath();
    var msites = this.points,
        iSite = this.points.length;
    while (iSite--) {
        v = msites[iSite];
        //TODO this doesn't need to be a rectangle; simplify with a dot if possible
        ctx.rect(v.x-2/3,v.y-2/3,2,2);
        }   
    ctx.fill();

    //TODO add the centers to the render list.
} 


/* **************************************************************** */
/*  paintBackground is relatively simple- it just draws the 
/*  background rectangle.
/* **************************************************************** */
CityMap.prototype.paintBackground = function(canvas,color){
        var ctx = canvas.getContext('2d');
        ctx.globalAlpha = 1;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.rect(0,0,canvas.width,canvas.height);
        ctx.fill();
}

