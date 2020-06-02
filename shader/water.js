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
    uniform samplerCube u_cubeEnvMap;

    // alle infos aus bottomModelMat ziehen??
    // parameterfrom?
    float w = 1.0; // pool x ausdehung
    float d = 1.0; // pool y ausdehung
    float l = 1.0; // pool z ausdehung
    float h = 0.1; // y verschiebung bzw wasserstand von 0 punkt aus
    float k = 0.6; // poolkante

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

    // d ist verschiebung der ebene in richtung n
    // returns scalar t
    // hit = origin + t*ray
    float intersectRayPlane(vec3 origin, vec3 ray, vec3 n, float d){
        float t = (d - dot(n, origin)) / dot(n, ray);
        return t;
    }  

    // das komisch kommt dann wenn spiegelung statt refraction kommen müsste 
    void main() {
        vec3 eyeRay = normalize(v_position.xyz - u_cameraPosition);

        bool aboveWater = u_cameraPosition.y > h;
        vec3 normal = aboveWater ? v_normal : -v_normal;
        float eta = aboveWater ? 1.0/1.3 : 1.3/1.0;
  
        vec3 refractRay = refract(eyeRay, normal, eta);
        float t1 = intersectRayPlane(v_position.xyz, refractRay, vec3(0, 1, 0), -d-h);
        float t2 = intersectRayPlane(v_position.xyz, refractRay, vec3(0, -1, 0), -d+h);
        float t3 = intersectRayPlane(v_position.xyz, refractRay, vec3(1, 0, 0), -w);
        float t4 = intersectRayPlane(v_position.xyz, refractRay, vec3(-1, 0, 0), -w);
        float t5 = intersectRayPlane(v_position.xyz, refractRay, vec3(0, 0, 1), -l);
        float t6 = intersectRayPlane(v_position.xyz, refractRay, vec3(0, 0, -1), -l);

        // get a valid value first, then find the smallest one above 0
        float t = max(0.0, max(t1, max(t2, max(t3, max(t4, max(t5, t6)))))); 
      
          if(t1 > 0.0 && t1 < t){
            t = t1;
        } if(t2 > 0.0 && t2 < t) {
            t = t2;
        } if(t3 > 0.0 && t3 < t) {
            t = t3;
        } if(t4 > 0.0 && t4 < t) {
            t = t4;
        } if(t5 > 0.0 && t5 < t) {
            t = t5;
        } if(t6 > 0.0 && t6 < t) {
            t = t6;
        } 

        vec3 hit = v_position.xyz + t*refractRay;
        hit.y += h;
        vec3 mRay = vec3(hit.x/w, hit.y/d, hit.z/l); 
        if(hit.y > d-h-k) // höhe-poolkante-wasserhöhe
            gl_FragColor = textureCube(u_cubeEnvMap, eyeRay);
        else
            gl_FragColor = textureCube(u_cubeMap, mRay);
        gl_FragColor.b = 1.0;
    }
`