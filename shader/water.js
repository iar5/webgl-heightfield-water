/**
 * water shader with reflektion/refraction based on a cubemap
 */
 export const water_vs = 
`
    precision highp float;

    uniform mat4 u_model;
    uniform mat4 u_view;
    uniform mat4 u_projection;

    attribute vec3 a_position;
    attribute vec3 a_normal;
    
    varying vec4 v_position;
    varying vec3 v_normal;

    void main() {
        v_normal = a_normal;
        v_position = u_model * vec4(a_position, 1.0);
        gl_Position = u_projection * u_view * v_position; 
    }
`



export const water_fs = 
`
    precision highp float;

    varying vec4 v_position;
    varying vec3 v_normal;

    uniform vec3 u_cameraPosition;
    uniform samplerCube u_cubeMap;

    // bottom sclae + transform über bottomModelMat?
    // später generisch als struc für alle wande mit position
    // parameterfrom?
    float d = 1.0;
    float w = 1.0;
    float l = 1.0;    

    vec2 getUVFromRectangle(vec2 hit, float rectWidth, float rectHeight){
        float u = (hit.x + 0.5*rectWidth)/rectWidth;
        float v = (hit.y + 0.5*rectHeight)/rectHeight;
        return vec2(u, v);
    }

    bool isHitInRectangle(vec2 hit, float rectWidth, float rectHeight){
        bool u = -rectWidth/2.0 <= hit.x && hit.x <= rectWidth/2.0;
        bool v = -rectHeight/2.0 <= hit.y && hit.y <= rectHeight/2.0;
        return u && v;
    }

    // d ist verschiebung in richtung n
    // returns scalar t. hit = origin + t*ray
    float intersectRayPlane(vec3 origin, vec3 ray, vec3 n, float d){
        float t = (d - dot(n, origin)) / dot(n, ray);
        return t;
    }  

    void main() {
        vec3 eyeRay = normalize(v_position.xyz - u_cameraPosition);

        vec3 refractRay = refract(eyeRay, v_normal, 1.0/1.1);

        float t1 = intersectRayPlane(v_position.xyz, refractRay, vec3(0, 1, 0), -d);
        float t2 = intersectRayPlane(v_position.xyz, refractRay, vec3(1, 0, 0), -w);
        float t3 = intersectRayPlane(v_position.xyz, refractRay, vec3(-1, 0, 0), -w);
        float t4 = intersectRayPlane(v_position.xyz, refractRay, vec3(0, 0, 1), -l);
        float t5 = intersectRayPlane(v_position.xyz, refractRay, vec3(0, 0, -1), -l);

        float t = 0.0;

        if(t1 >= 0.0){
            t = t1;
        }
        if (t2 > 0.0 && t2 < t) {
            t = t2;
        } 
        if (t3 > 0.0 && t3 < t) {
            t = t3;
        } 
        if (t4 > 0.0 && t4 < t) {
            t = t4;
        }       
        if (t5 > 0.0 && t5 < t) {
            t = t5;
        } 

        vec3 hit = v_position.xyz + t * refractRay;
        vec3 mRay = -vec3(hit.x/w, hit.y/d, hit.z/l); 
        gl_FragColor = textureCube(u_cubeMap, mRay);
        gl_FragColor.b = 1.0;
        //gl_FragColor = vec4(v_normal, 1.0);
    }

`