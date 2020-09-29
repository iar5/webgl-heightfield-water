export const init_vs = 
`
    precision highp float;

    attribute vec2 a_position; 

    varying vec2 v_texcoord;  

    void main() {
        v_texcoord = 0.5 * a_position + 0.5; // from [-1, 1] clip space to [0, 1] texture space
        gl_Position = vec4(a_position, 0.0, 1.0); 
    }
`

export const init_fs = `
precision highp float;

varying vec2 v_texcoord;

void main() {

	vec2 p = vec2(.5, .5);
	float x = v_texcoord.x - p.x;
	float y = v_texcoord.y - p.y;
    float r = 0.1;
    
	vec4 result =  vec4(0, 0, 0, 1); 
    result.r = (x*x + y*y < r ? (r-(x*x+y*y))/r : 0.);
    //result.r = (x*x + y*y < r*r ? (r-abs(x) + r-abs(y))*5. : 0.);

	gl_FragColor = result;
}`;

// init wird nicht richtig eingelesen
// manchmal klappt was komisches weil texture values so undefiniert sind ?!