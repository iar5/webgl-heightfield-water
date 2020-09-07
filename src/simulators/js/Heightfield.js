import * as Vec3 from './../../../lib/twgl/v3.js'
import * as Mat4 from './../../../lib/twgl/m4.js'


const tempVec3 = Vec3.create()

export default class Heightfield{

    /**
     * Given vertices and indices only as triangel strip?!
     * @param {*} vertCountX 
     * @param {*} vertCountZ 
     * @param {*} vertices 
     * @param {*} indices 
     */
    constructor(vertCountX, vertCountZ, vertices, indices, updatefunction){
        this._vertCountX = vertCountX
        this._vertCountZ = vertCountZ

        this._vertices = vertices
        this._indices = indices
        this.normals = [] 

        this._vertexTriangles = this._makeTriangles(this._indices) // <VertexId, Array<TriagleId>>
        this._triangleNormals = Array.from({length: this._indices.length}, e => Array(3).fill(0)); // <TriagleId, TriangleNormal>
    
        this.updatefunction = updatefunction
        this.updatefunction.initialize(this._vertCountX, this._vertCountZ)
    }

    /** 
     * triangles[VertexId] = Array<TriagleId of adjazenten triangles
     * triangle id is given by its position in triangle strip
     * @returns {Array} 
     */
    _makeTriangles(){
        let vertexTriangles = []

        // fill with empty arrays
        for(var i=0; i<this._vertices.length/3; i++)
            vertexTriangles.push([])

        // push triangle id to vertice id
        for (let i=0; i<this._indices.length-2; i++) {
            let vId1 = this._indices[i]
            let vId2 = this._indices[i+1]
            let vId3 = this._indices[i+2]

            if(this._isTriangle(vId1, vId2, vId3)) {
                vertexTriangles[vId1].push(i)
                vertexTriangles[vId2].push(i)
                vertexTriangles[vId3].push(i)
            }
        }    
        return vertexTriangles
    }

    update(){
        this.updatefunction.update()
        let heightmap = this.updatefunction.getHeightfield()
          
        for(let i=0; i<this._vertices.length/3; i++){
            let x = i % this._vertCountX
            let y = Math.floor(i/this._vertCountX)
            this._vertices[i*3+1] = heightmap[x][y]
        }
        this._updateTriangleNormals()
        this._updateVertexNormals()
    }

    _updateTriangleNormals(){
        for(let i=0; i<this._indices.length; i++){
            let vId1 = this._indices[i]
            let vId2 = this._indices[i+1]
            let vId3 = this._indices[i+2]

            if(this._isTriangle(vId1, vId2, vId3)) {
                // calculate normal for every triangle in triangle strip 
                let v1 = [this._vertices[vId1*3], this._vertices[vId1*3+1], this._vertices[vId1*3+2]]
                let v2 = [this._vertices[vId2*3], this._vertices[vId2*3+1], this._vertices[vId2*3+2]]
                let v3 = [this._vertices[vId3*3], this._vertices[vId3*3+1], this._vertices[vId3*3+2]]
                    
                let v21 = Vec3.subtract(v2, v1)
                let v31 = Vec3.subtract(v3, v1)
                let n = Vec3.cross(v21, v31)
                
                // in triangle strip the triangles are not equally arranged in termes of clockwise/counterclockwise 
                // every second triangle need to get flipped
                // not sure if my implementation is conventional correct but its uniform and working
                if(i%2==1) Vec3.mulScalar(n, -1, n)

                Vec3.normalize(n, n)
                Vec3.copy(n, this._triangleNormals[i]) 
            }
        }          
    }

    _updateVertexNormals(){
        for(let i=0; i<this._vertices.length/3; i++){
            let adjacentTriangleIds = this._vertexTriangles[i]

            let n = tempVec3
            for(let t of adjacentTriangleIds){                                    
                Vec3.add(n, this._triangleNormals[t], n)
            }

            Vec3.normalize(n, n)                        
            this.normals[i*3] = n[0]
            this.normals[i*3+1] = n[1]
            this.normals[i*3+2] = n[2]
        }          
    }

    /**
     * Wenn ein Indice zwei mal hintereinader steht ist es kein Dreieck (und wird im Triangle Strip übersprungen)
     * @param {*} vId1 
     * @param {*} vId2 
     * @param {*} vId3 
     */
    _isTriangle(vId1, vId2, vId3){
        return vId1 && vId2 && vId3 && vId1!=vId2 && vId1!=vId3 && vId2!=vId3
    }
}

