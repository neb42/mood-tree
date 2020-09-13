uniform float time;
uniform float colorR;
uniform float colorG;
uniform float colorB;

varying float vRatio;
varying vec2 vSpeed;
mat2 rot( float a){
  return mat2(cos(a), -sin(a), sin(a), cos(a));
}
uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	
  if (vRatio == 1.) discard;

  vec2 uv = gl_PointCoord - 0.5;

  float a = (time * vSpeed.x + vSpeed.x) * 10.;
  
  uv *= rot(a);
  uv.y *= floor(a + 0.5) == 0. ? 1.25 : 2. + sin(a * PI);

  if (length(uv) > 0.5) discard;  // shape function

  #include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	
  // 3 col = vec3(1, 0.7, 0.9);
  // vec3 col = vec3(59. / 255., 95. / 255., 11. / 255.);
  vec3 col = vec3(colorR / 255., colorG / 255., colorB / 255.);
  float d = clamp(uv.x + .5, 0., 1.);
  vec4 diffuseColor = vec4(mix(diffuse, col, pow(d, 2.)), 1.);
  diffuseColor = vec4(mix(diffuseColor.rgb, vec3(0.95, 0, 0.45), 0.), 1.);

	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	outgoingLight = diffuseColor.rgb;
	gl_FragColor = vec4( outgoingLight, diffuseColor.a );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}