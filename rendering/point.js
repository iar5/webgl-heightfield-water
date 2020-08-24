export const point_fs = 
`
    precision highp float;

    varying vec4 v_color;

    void main(void) {
        gl_FragColor = v_color;
    }
`

export const point_vs = 
`
    precision highp float;

    uniform mat4 u_projection;
    uniform mat4 u_view;
    uniform mat4 u_model;

    attribute vec4 a_color;
    attribute vec3 a_position;

    varying vec4 v_color;

    void main() {
        v_color = a_color;
        gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
        gl_PointSize = 5.0;
    }
`
