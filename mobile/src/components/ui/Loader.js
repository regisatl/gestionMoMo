/**
 * Loader.js — GestionMoMo Mobile
 *
 * Animation réseau MoMo :
 *  - Logo central pulsant
 *  - Ondes concentriques
 *  - Nœuds satellites orbitants
 *  - Texte de chargement animé
 */

import React, { useEffect, useRef } from 'react';

import {
  View,
  Text,
  Animated,
  Easing,
  StyleSheet,
  Platform,
} from 'react-native';

import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';


// ─── Constantes ────────────────────────────────────────────────

const CENTER = 70;
const ORBIT_R = 52;


// ─── Position satellite ────────────────────────────────────────

const nodePos = (deg) => {
  const rad = (deg * Math.PI) / 180;

  return {
    x: CENTER + ORBIT_R * Math.cos(rad) - 5,
    y: CENTER + ORBIT_R * Math.sin(rad) - 5,
  };
};


// ─── Wave ──────────────────────────────────────────────────────

const Wave = ({ delay, color }) => {

  const scale = useRef(
    new Animated.Value(0.5)
  ).current;


  const opacity = useRef(
    new Animated.Value(0.7)
  ).current;



  useEffect(() => {

    const animation = Animated.loop(

      Animated.sequence([

        Animated.delay(delay),

        Animated.parallel([

          Animated.timing(scale, {
            toValue: 2.4,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),

          Animated.timing(opacity, {
            toValue: 0,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),

        ]),


        Animated.parallel([

          Animated.timing(scale, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: true,
          }),

          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 0,
            useNativeDriver: true,
          }),

        ]),

      ])

    );


    animation.start();


    return () => {
      animation.stop();
    };


  }, []);



  return (

    <Animated.View

      style={[

        styles.wave,

        {
          borderColor: color,
          opacity,

          transform:[
            {
              scale
            }
          ]
        }

      ]}

    />

  );

};



// ─── OrbitNode corrigé ─────────────────────────────────────────

const OrbitNode = ({
  angle,
  delay,
  color,
}) => {


  const rotate = useRef(
    new Animated.Value(0)
  ).current;


  const dotScale = useRef(
    new Animated.Value(1)
  ).current;



  useEffect(() => {


    const rotateAnimation = Animated.loop(

      Animated.timing(
        rotate,
        {
          toValue:1,
          duration:3000,
          delay,
          easing:Easing.linear,
          useNativeDriver:true,
        }
      )

    );



    const scaleAnimation = Animated.loop(

      Animated.sequence([

        Animated.delay(delay),

        Animated.timing(
          dotScale,
          {
            toValue:1.4,
            duration:500,
            useNativeDriver:true,
          }
        ),


        Animated.timing(
          dotScale,
          {
            toValue:1,
            duration:500,
            useNativeDriver:true,
          }
        ),

      ])

    );



    rotateAnimation.start();
    scaleAnimation.start();



    return () => {

      rotateAnimation.stop();
      scaleAnimation.stop();

    };


  }, []);



  const spin = rotate.interpolate({

    inputRange:[
      0,
      1
    ],

    outputRange:[
      '0deg',
      '360deg'
    ]

  });



  const reverseSpin = rotate.interpolate({

    inputRange:[
      0,
      1
    ],

    outputRange:[
      '0deg',
      '-360deg'
    ]

  });



  const position = nodePos(angle);



  return (

    <Animated.View

      style={[

        styles.orbitNodeContainer,

        {
          left: position.x,
          top: position.y,

          transform:[
            {
              rotate: spin
            }
          ]

        }

      ]}

    >

      <Animated.View

        style={[

          styles.orbitNode,

          {

            backgroundColor: color,


            transform:[

              {
                rotate: reverseSpin
              },

              {
                scale: dotScale
              }

            ],


            shadowColor: color,

          }

        ]}

      />


    </Animated.View>

  );

};

// ─── Logo central ──────────────────────────────────────────────

const CenterLogo = () => {

  const pulse = useRef(
    new Animated.Value(1)
  ).current;


  const glow = useRef(
    new Animated.Value(0)
  ).current;



  useEffect(() => {


    const animation = Animated.loop(

      Animated.sequence([


        Animated.parallel([

          Animated.timing(pulse,{
            toValue:1.08,
            duration:900,
            easing:Easing.inOut(Easing.ease),
            useNativeDriver:true,
          }),


          Animated.timing(glow,{
            toValue:1,
            duration:900,
            useNativeDriver:true,
          })

        ]),



        Animated.parallel([

          Animated.timing(pulse,{
            toValue:1,
            duration:900,
            easing:Easing.inOut(Easing.ease),
            useNativeDriver:true,
          }),


          Animated.timing(glow,{
            toValue:0,
            duration:900,
            useNativeDriver:true,
          })

        ])


      ])

    );


    animation.start();


    return () => {
      animation.stop();
    };


  },[]);



  const glowOpacity = glow.interpolate({

    inputRange:[
      0,
      1
    ],

    outputRange:[
      0.15,
      0.45
    ]

  });



  return (

    <View style={styles.logoOuter}>


      <Animated.View

        style={[
          styles.logoHalo,
          {
            opacity: glowOpacity
          }
        ]}

      />



      <Animated.View

        style={[
          styles.logoBox,

          {
            transform:[
              {
                scale:pulse
              }
            ]
          }

        ]}

      >

        <Text style={styles.logoText}>
          M
        </Text>


      </Animated.View>


    </View>

  );

};



// ─── Points de chargement ──────────────────────────────────────

const LoadingDots = ({ color }) => {

  const dot1 = useRef(new Animated.Value(1)).current;
  const dot2 = useRef(new Animated.Value(1)).current;
  const dot3 = useRef(new Animated.Value(1)).current;

  const dots = [dot1, dot2, dot3];


  useEffect(() => {

    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([

          Animated.delay(index * 200),

          Animated.timing(dot, {
            toValue: 1.5,
            duration: 400,
            useNativeDriver:true,
          }),

          Animated.timing(dot, {
            toValue:1,
            duration:400,
            useNativeDriver:true,
          })

        ])
      )
    );


    animations.forEach(anim => anim.start());


    return () => {
      animations.forEach(anim => anim.stop());
    };


  }, []);



  return (
    <View style={styles.dotsRow}>

      {dots.map((dot,index)=>(

        <Animated.View

          key={index}

          style={[
            styles.dot,
            {
              backgroundColor:color,
              transform:[
                {
                  scale:dot
                }
              ]
            }
          ]}

        />

      ))}

    </View>
  );
};


// ─── Loader principal ──────────────────────────────────────────

const Loader = ({
  message,
  fullscreen = true,
  style,
}) => {


  const {t} = useTranslation();

  const theme = useTheme();



  const label = message
    ? t(message, { defaultValue: message })
    : t('common.loader.default');



  const primary =
    theme.colors?.primary || '#0A66C2';



  const accent =
    '#60B4FF';



  return (

    <View

      style={[

        fullscreen
        ? styles.fullscreen
        : styles.inline,


        {
          backgroundColor:
          fullscreen
          ? theme.background
          : 'transparent'
        },


        style

      ]}

    >


      <View style={styles.animBox}>


        <Wave
          delay={0}
          color={primary}
        />


        <Wave
          delay={650}
          color={accent}
        />


        <Wave
          delay={1300}
          color={primary}
        />



        <OrbitNode
          angle={0}
          delay={0}
          color={accent}
        />


        <OrbitNode
          angle={90}
          delay={750}
          color={primary}
        />


        <OrbitNode
          angle={180}
          delay={1500}
          color={accent}
        />


        <OrbitNode
          angle={270}
          delay={2250}
          color={primary}
        />



        <CenterLogo />


      </View>




      <View style={styles.textBox}>


        <Text
          style={[
            styles.title,
            {
              color:theme.text
            }
          ]}
        >
          GestionMoMo
        </Text>



        {
          label ? (

            <Text

              style={[
                styles.message,
                {
                  color:theme.textSecondary
                }
              ]}

            >

              {label}

            </Text>

          ) : null
        }



        <LoadingDots color={primary}/>


      </View>


    </View>

  );

};



// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({


  fullscreen:{
    flex:1,
    alignItems:'center',
    justifyContent:'center',
  },


  inline:{
    alignItems:'center',
    justifyContent:'center',
    paddingVertical:40,
  },


  animBox:{
    width:CENTER*2,
    height:CENTER*2,
    alignItems:'center',
    justifyContent:'center',
    position:'relative',
  },


  wave:{
    position:'absolute',
    width:70,
    height:70,
    borderRadius:35,
    borderWidth:1.5,
  },


  orbitNodeContainer:{
    position:'absolute',
    width:10,
    height:10,
  },


  orbitNode:{
    width:10,
    height:10,
    borderRadius:5,

    ...Platform.select({

      ios:{
        shadowOffset:{
          width:0,
          height:0,
        },
        shadowOpacity:0.8,
        shadowRadius:6,
      },


      android:{
        elevation:4,
      }

    })

  },


  logoOuter:{
    alignItems:'center',
    justifyContent:'center',
  },


  logoHalo:{
    position:'absolute',
    width:80,
    height:80,
    borderRadius:24,
    backgroundColor:'#0A66C2',
  },


  logoBox:{
    width:62,
    height:62,
    borderRadius:20,
    backgroundColor:'#0A66C2',
    alignItems:'center',
    justifyContent:'center',
  },


  logoText:{
    color:'white',
    fontSize:38,
    fontWeight:'900',
  },


  textBox:{
    marginTop:24,
    alignItems:'center',
  },


  title:{
    fontSize:17,
    fontWeight:'800',
  },


  message:{
    fontSize:12,
    marginTop:5,
  },


  dotsRow:{
    flexDirection:'row',
    gap:5,
    marginTop:8,
  },


  dot:{
    width:5,
    height:5,
    borderRadius:3,
  },


});
export default Loader;
