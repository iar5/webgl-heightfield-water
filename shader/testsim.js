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

    uniform int u_framenumber;
    uniform sampler2D u_texture;
    uniform vec4 u_color;
    
    varying vec2 v_texcoord;

    void main() {

        float h = 0.2; // column width
        float c = 0.6; // wave travel speed <h/t
        float t = 0.1; // timestep <h/c
        float slowdown = 0.98;

        // all modifikation stuff here
        vec4 value = texture2D(u_texture, v_texcoord);
        
        value.b = float(u_framenumber)/100.;
        gl_FragColor = value;
    }
`