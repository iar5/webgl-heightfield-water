export const testsim_vs = 
`
    precision highp float;

    attribute vec2 a_position; 

    varying vec2 v_texcoord;  

    void main() {
        v_texcoord = 0.5 * a_position + 0.5; 
        gl_Position = vec4(a_position, 0.0, 1.0); 
    }
`

export const testsim_fs = 
`
    precision highp float;

    // adjustable parameters
    float h = 0.2; // column width
    float c = 0.3; // wave travel speed <h/t
    float t = 0.1; // timestep <h/c
    float slowdown = 0.98;

    uniform int u_frame;
    uniform vec2 u_stepsize;
    uniform sampler2D u_texture;
    
    varying vec2 v_texcoord;

    float encode(float value) { return clamp(value, -1., 1.)/2. + 0.5; }

    float decode(float value) { return (value-0.5)*2.; }

    float U(int x, int y) {
        vec2 c = v_texcoord + vec2(x, y)*u_stepsize;
        if (c.x<0.||c.x>1.||c.y<0.||c.y>1.) { return 0.; }
        else {
            vec4 tex = texture2D(u_texture, c);
            return decode(tex.r);
        } 
    }

    float V() {
        vec4 tex = texture2D(u_texture, v_texcoord);
        return decode(tex.g);
    }

    void main() {
        // let f = c*c * (u[i+1][j] + u[i-1][j] + u[i][j+1] + u[i][j-1] - 4*u[i][j]) / (h*h)           
        // v[i][j] += t*f; 
        // v[i][j] *= slowdown
        // unew[i][j] = u[i][j] + t * v[i][j] 

        float f = c*c * (U(1,0) + U(-1,0) + U(0,1) + U(0,-1) - 4.*U(0,0)) / (h*h);
        float v = V() + t*f;
        v *= slowdown;
        float u = U(0,0) + t*v;
        vec4 result = vec4(encode(u), encode(v), 0, 1);

   
        // ab hier test stuff hier // 

        u = (U(0,0)+U(1,0))/2.;
        u += float(u_frame)*0.0001;
        result.r = encode(u); 
        gl_FragColor = result;
    }
`
// v scheint immer negativ zu sein? warum?
// kann  negativ sein? also ist das nen gradient oder ist die relativ zur position 
// stepsize falsch?

/*
schreibt er in die der er liset?
das folgende dürfte doch eigentlich nicht an werten verlieren?! amplitude vom berg geht aber imme weiter runter
u = (U(0,0)+U(1,0))/2.;
result.r = encode(u); 

u = U(0,0) + float(u_frame)*0.0001;
warum springt manchmal so?

u = (U(0,0)+U(1,0))/2.;
u += float(u_frame)*0.0001;
das selbe hier
von den werten her passt alles aber das gespringe kp
*/

