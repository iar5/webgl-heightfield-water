export const testinit_vs = 
`
    precision highp float;

    attribute vec2 a_position; 

    varying vec2 v_texcoord;  

    void main() {
        v_texcoord = 0.5 * a_position + 0.5; // from [-1, 1] clip space to [0, 1] texture space
        gl_Position = vec4(a_position, 0.0, 1.0); 
    }
`

export const testinit_fs = `
precision highp float;

varying vec2 v_texcoord;

float encode(float value) { return clamp(value, -1., 1.)/2. + 0.5; }

float decode(float value) { return (value-0.5)*2.; }

void main() {

	vec2 p = vec2(.5, .5);
	float x = v_texcoord.x - p.x;
	float y = v_texcoord.y - p.y;
	float r = 0.1;
	vec4 result =  vec4(0, 0, 0, 1);

	result.r = encode(x*x + y*y < r ? result.r = (r-(x*x+y*y))/r : 0.);
    result.r = encode(0.);

	gl_FragColor = result;
}`;