uniform float time;
uniform float lowerLimit;
uniform float upperLimit;
uniform float upperRatio;
uniform float spiralRadius;
uniform float spiralTurns;
uniform float size;
uniform float scale;

attribute vec2 speed;

varying float vRatio;
varying vec2 vSpeed;

mat2 rot( float a){
  return mat2(cos(a), -sin(a), sin(a), cos(a));
}

#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {
	#include <color_vertex>
	#include <begin_vertex>

  float t = time < 0. ? 0. : time;
  
  float h = mod(speed.y * t, upperLimit) + lowerLimit;
  float hRatio = clamp(h / upperLimit, 0., 1.);
  vRatio = hRatio;
  vSpeed = speed;
  
  transformed.y = h;
  
  float a = atan(position.x, position.z);
  a += speed.x * t;
  float initLength = length(position.xz);
  float finalLength = initLength * upperRatio;
  float ratio = mix(initLength, finalLength, hRatio);
  transformed.x = cos(a) * ratio;
  transformed.z = sin(a) * -ratio;
  
  float sTurns = sin(time * 0.5) * 0.5 + spiralTurns;

  float spiralA = hRatio * sTurns * PI * 2.;
  float sRadius = mix(spiralRadius, 0., hRatio);
  transformed.x += cos(spiralA) * sRadius;
  transformed.z += sin(spiralA) * -sRadius;

	#include <morphtarget_vertex>
	#include <project_vertex>
	bool cond = floor(speed.y + 0.5) == 0.;
  gl_PointSize = size * ( cond ? 0.75 : ((1. - hRatio) * (smoothstep(0., 0.01, hRatio) * 0.25) + 0.75));
  gl_PointSize = gl_PointSize, size * 2.;
    
	#ifdef USE_SIZEATTENUATION
    bool isPerspective = isPerspectiveMatrix( projectionMatrix );
    if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}