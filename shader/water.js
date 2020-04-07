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

    float d = -0.5;
    float w = 5.0;
    float l = 4.0;
    // Mat4 bottomModelMat


    bool intersectRectangle(vec3 origin, vec3 ray, vec3 n, float d){
        float t = (d - dot(n, origin)) / dot(n, ray);
        
        if (t <= 0.0){ 
            return false; 
        }

        vec3 hit = origin + t * ray;

        if(hit.x > -w/2.0 && hit.x < w/2.0 && hit.z > -l/2.0 && hit.z < l/2.0){
            return true;
        } else{ 
            return false; 
        }
    } 


    vec3 getRefractinRay(vec3 incident, vec3 n){
        float ior = 1.0 / 1.33;
        float c1 = dot(n, incident);
        float c2 = sqrt(1.0 - (ior*ior) * (1.0 - c1*c1));
        vec3 t = ior * incident + (ior*c1 - c2) * n;
        return t;
    }


    void main() {

        // 1. calculate refraktion ray
        vec3 ray = normalize(v_position.xyz - u_cameraPosition);

        // 2.a refraction
        vec3 refract = getRefractinRay(ray, v_normal);
        bool intersectBottom = intersectRectangle(v_position.xyz, refract, v_normal, d);

        if(intersectBottom){
            gl_FragColor = vec4(v_normal, 1.0);
        }
        else{
            gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
        }


        // 2.b reflektion 
        // vec3 reflect = ray - 2.0 * dot(ray, v_normal) * v_normal; 
    }

`