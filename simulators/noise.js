var arr

function initialize(_widthX, _widthZ){
    widthX = _widthX
    widthZ = _widthZ
    u = [...Array(widthX)].map(e => Array(widthZ).fill(0))
}

function update(){
    for(let x=0; x<widthX; x++){
        for(let z=0; z<widthZ; z++){
            arr[x][z] = noise(x*0.01, Date.now()*0.001, z*0.01)
        }
    }
    return arr
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