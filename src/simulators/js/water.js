import * as Vec3 from './../../../lib/twgl/v3.js'
import * as Mat4 from './../../../lib/twgl/m4.js'

const h = 0.2 // column width
const c = 0.6 // wave travel speed <h/t
const t = 0.1 // timestep <h/c
const slowdown = 0.99

var vCountX
var vCountZ

var u
var unew
var v

/**
 *  
 * @param {Number} verticesXCount 
 * @param {Number} verticesZCount 
 */
function initialize(x, y){
    vCountX = x
    vCountZ = y
    u = [...Array(vCountX)].map(e => Array(vCountZ).fill(0));
    unew = [...Array(vCountX)].map(e => Array(vCountZ).fill(0));
    v = [...Array(vCountX)].map(e => Array(vCountZ).fill(0))

    for(let i=0; i<vCountX; i++){
        for(let j=0; j<vCountZ; j++){
            let x = i-vCountX/2
            let z = j-vCountZ/2
            let r = Math.max(x,y)*0.1
            if(x*x+z*z < r) {
                u[i][j] = (r-x*x+z*z) * 1/(4*r)  
            }
        }    
    }
}


/**
 * 
 * @returns the updated heightfield
 */
function update(){

    // unew bzw u_t+1 berechnen 
    // TODO geisterspalte u was wenn auf 
    for(let i=1; i<vCountX-1; i++){
        for(let j=1; j<vCountZ-1; j++){
            let f =  c*c * (u[i+1][j] + u[i-1][j] + u[i][j+1] + u[i][j-1] - 4*u[i][j] ) / (h*h)           
            v[i][j] += t * f
            v[i][j] *= slowdown
            unew[i][j] = u[i][j] + t * v[i][j] 
        }    
    }

    // u mit unew überschreiben
    for(let i=0; i<vCountX; i++){
        for(let j=0; j<vCountZ; j++){        
            u[i][j] = unew[i][j] 
        }
    }         
    return u
}

/**
 * 
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} intensity 
 */
function drop(x, y, intensity){
    if(x>0 && y>0 && x<vCountX && y<vCountX)
    u[x][y] -= intensity
}


/**
 * PUBLIC FUNCTIONS
 */
export default (function(){
    return {
        initialize,
        update,
        drop,
    }
})()