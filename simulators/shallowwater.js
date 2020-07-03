import * as Vec3 from '../lib/twgl/v3.js'
import * as Mat4 from '../lib/twgl/m4.js'


var u
var widthX
var widthZ


function initialize(_widthX, _widthZ){
    widthX = _widthX
    widthZ = _widthZ
    u = Array(widthX).map(e => Array(widthZ).fill(0));

    for(let i=0; i<widthX; i++){
        for(let j=0; j<widthZ; j++){
            let x = i-widthX/2
            let z = j-widthZ/2
            if(x*x+z*z < 4) u[i][j] = 0.5
        }    
    }
}

function update(){

}



/**
 * PUBLIC FUNCTIONS
 */
export const simulation = (function(){
    return {
        initialize,
        update,
    }
})()