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
    float w = 4.0;
    float l = 4.0;
    // Mat4 bottomModelMat



    // d ist verschiebung in richtung n
    bool intersectRayRectangle(vec3 origin, vec3 ray, vec3 n, float d){
        float t = (d - dot(n, origin)) / dot(n, ray);
        
        if (t <= 0.0){ 
            return false; 
        }
        vec3 hit = origin + t * ray;

        if(hit.x > -w/2.0 && hit.x < w/2.0 && hit.z > -l/2.0 && hit.z < l/2.0){
            return true;
        } else { 
            return false; 
        }
    } 


    vec3 refract(vec3 incident, vec3 n){
        float etai = 1.0;
        float etat = 1.33; 

        float cosi = clamp(dot(incident, n), -1.0, 1.0); 
        if (cosi < 0.0) { 
            cosi = -cosi; 
        } else { 
            float temp = etai;
            etai = etat;
            etat = temp;
            n = -n;
        } 
        float eta = etai / etat; 
        float k = 1.0 - eta*eta * (1.0 - cosi*cosi); 
        return eta*incident + (eta*cosi - sqrt(k))*n;  
    }
    
    void main() {
        vec3 ray = normalize(v_position.xyz - u_cameraPosition);

        vec3 refractRay = refract(ray, v_normal);

        bool intersectBottom = intersectRayRectangle(v_position.xyz, refractRay, v_normal, d);
        if(intersectBottom){
            gl_FragColor = vec4(v_normal, 1.0);
        } else {
            gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
        }


        // 2.b reflektion 
        // vec3 reflect = ray - 2.0 * dot(ray, v_normal) * v_normal; 
    }

`