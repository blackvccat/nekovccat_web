/*
 my city model
*/

import { useRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'




const City = (props) => {
  const group = useRef()
  const { nodes, materials, animations } = useGLTF('/city.glb')
  const { actions } = useAnimations(animations, group)
  
  // 如果需要播放动画，可以在这里使用 actions
  // useEffect(() => {
  //   if (actions && actions['AnimationName']) {
  //     actions['AnimationName'].play()
  //   }
  // }, [actions])
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <mesh
          name="Plane001"
          castShadow
          receiveShadow
          geometry={nodes.Plane001.geometry}
          material={materials['Material.001']}
          position={[593.122, 60.482, 1240.184]}
          rotation={[0, 0, 1.858]}
          scale={[367.885, 367.885, 2144.889]}
        />
        <mesh
          name="Cube"
          castShadow
          receiveShadow
          geometry={nodes.Cube.geometry}
          material={materials.fog}
          position={[0, 130.382, 0]}
          scale={[705.29, 583.585, 740.864]}
        />
        <mesh
          name="Cube002"
          castShadow
          receiveShadow
          geometry={nodes.Cube002.geometry}
          material={materials['fog.001']}
          position={[-75.657, -39.436, 217.518]}
          scale={[114.14, 108.413, 338.882]}
        />
        <mesh
          name="Cube003"
          castShadow
          receiveShadow
          geometry={nodes.Cube003.geometry}
          material={materials['fog.002']}
          position={[118.266, -40.769, -393.059]}
          rotation={[0.271, 0, 0]}
          scale={[364.979, 117.063, 148.612]}
        />
        <mesh
          name="Cube004"
          castShadow
          receiveShadow
          geometry={nodes.Cube004.geometry}
          material={nodes.Cube004.material}
          position={[111.729, -0.064, 572.382]}
          scale={[16.723, 0.068, 22.803]}
        />
        <group name="(2)_mcprep_empty" position={[0, 191.5, 0]}>
          <group
            name="deepslate_bricks"
            position={[0, -192.5, 0]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Deepslate_Bricks"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate_Bricks.geometry}
              material={materials.deepslate_bricks}
            />
            <mesh
              name="Deepslate_Bricks_1"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate_Bricks_1.geometry}
              material={materials.deepslate_top}
            />
            <mesh
              name="Deepslate_Bricks_2"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate_Bricks_2.geometry}
              material={materials.deepslate_coal_ore}
            />
            <mesh
              name="Deepslate_Bricks_3"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate_Bricks_3.geometry}
              material={materials.deepslate_tiles}
            />
          </group>
          <group
            name="deepslate_bricks019"
            position={[0, -192.5, 0]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Deepslate_Bricks006"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate_Bricks006.geometry}
              material={materials.deepslate_bricks}
            />
            <mesh
              name="Deepslate_Bricks006_1"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate_Bricks006_1.geometry}
              material={materials.deepslate_top}
            />
            <mesh
              name="Deepslate_Bricks006_2"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate_Bricks006_2.geometry}
              material={materials.deepslate_coal_ore}
            />
            <mesh
              name="Deepslate_Bricks006_3"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate_Bricks006_3.geometry}
              material={materials.deepslate_tiles}
            />
          </group>
        </group>
        <group name="(2)_mcprep_empty001" position={[-0.5, 191, -0.5]}>
          <mesh
            name="acacia_log"
            castShadow
            receiveShadow
            geometry={nodes.acacia_log.geometry}
            material={materials.acacia_log}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="acacia_planks"
            castShadow
            receiveShadow
            geometry={nodes.acacia_planks.geometry}
            material={materials.acacia_planks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="andesite"
            castShadow
            receiveShadow
            geometry={nodes.andesite.geometry}
            material={materials.andesite}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="andesite001"
            castShadow
            receiveShadow
            geometry={nodes.andesite001.geometry}
            material={materials.andesite}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="andesite002"
            castShadow
            receiveShadow
            geometry={nodes.andesite002.geometry}
            material={materials.andesite}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="andesite003"
            castShadow
            receiveShadow
            geometry={nodes.andesite003.geometry}
            material={materials.andesite}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="barrel_side"
            castShadow
            receiveShadow
            geometry={nodes.barrel_side.geometry}
            material={materials.barrel_side}
            position={[162.871, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="bedrock"
            castShadow
            receiveShadow
            geometry={nodes.bedrock.geometry}
            material={materials.bedrock}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="beehive_end"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Beehive"
              castShadow
              receiveShadow
              geometry={nodes.Beehive.geometry}
              material={materials.beehive_end}
            />
            <mesh
              name="Beehive_1"
              castShadow
              receiveShadow
              geometry={nodes.Beehive_1.geometry}
              material={materials.beehive_side}
            />
          </group>
          <mesh
            name="birch_planks"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks.geometry}
            material={materials.birch_planks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="birch_planks001"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks001.geometry}
            material={materials.birch_planks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="birch_planks002"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks002.geometry}
            material={materials.birch_planks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="birch_trapdoor"
            castShadow
            receiveShadow
            geometry={nodes.birch_trapdoor.geometry}
            material={materials.birch_trapdoor}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="black_concrete"
            castShadow
            receiveShadow
            geometry={nodes.black_concrete.geometry}
            material={materials.black_concrete}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="black_concrete_powder"
            castShadow
            receiveShadow
            geometry={nodes.black_concrete_powder.geometry}
            material={materials.black_concrete_powder}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="black_stained_glass"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Black_Stained_Glass_Pane"
              castShadow
              receiveShadow
              geometry={nodes.Black_Stained_Glass_Pane.geometry}
              material={materials.black_stained_glass}
            />
            <mesh
              name="Black_Stained_Glass_Pane_1"
              castShadow
              receiveShadow
              geometry={nodes.Black_Stained_Glass_Pane_1.geometry}
              material={materials.black_stained_glass_pane_top}
            />
          </group>
          <mesh
            name="black_wool"
            castShadow
            receiveShadow
            geometry={nodes.black_wool.geometry}
            material={materials.black_wool}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="blackstone"
            castShadow
            receiveShadow
            geometry={nodes.blackstone.geometry}
            material={materials.blackstone}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="blue_concrete"
            castShadow
            receiveShadow
            geometry={nodes.blue_concrete.geometry}
            material={materials.blue_concrete}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="blue_concrete_powder"
            castShadow
            receiveShadow
            geometry={nodes.blue_concrete_powder.geometry}
            material={materials.blue_concrete_powder}
            position={[197.945, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="bone_block_side"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Bone_Block"
              castShadow
              receiveShadow
              geometry={nodes.Bone_Block.geometry}
              material={materials.bone_block_side}
            />
            <mesh
              name="Bone_Block_1"
              castShadow
              receiveShadow
              geometry={nodes.Bone_Block_1.geometry}
              material={materials.bone_block_top}
            />
          </group>
          <group
            name="brewing_stand_base"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Brewing_Stand"
              castShadow
              receiveShadow
              geometry={nodes.Brewing_Stand.geometry}
              material={materials.brewing_stand_base}
            />
            <mesh
              name="Brewing_Stand_1"
              castShadow
              receiveShadow
              geometry={nodes.Brewing_Stand_1.geometry}
              material={materials.brewing_stand}
            />
          </group>
          <mesh
            name="bricks"
            castShadow
            receiveShadow
            geometry={nodes.bricks.geometry}
            material={materials.bricks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="bricks001"
            castShadow
            receiveShadow
            geometry={nodes.bricks001.geometry}
            material={materials.bricks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="brown_candle"
            castShadow
            receiveShadow
            geometry={nodes.brown_candle.geometry}
            material={materials.brown_candle}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="brown_concrete_powder"
            castShadow
            receiveShadow
            geometry={nodes.brown_concrete_powder.geometry}
            material={materials.brown_concrete_powder}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="brown_mushroom"
            castShadow
            receiveShadow
            geometry={nodes.brown_mushroom.geometry}
            material={materials.brown_mushroom}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="brown_mushroom_block"
            castShadow
            receiveShadow
            geometry={nodes.brown_mushroom_block.geometry}
            material={materials.brown_mushroom_block}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="calcite"
            castShadow
            receiveShadow
            geometry={nodes.calcite.geometry}
            material={materials.calcite}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="campfire_log"
            castShadow
            receiveShadow
            geometry={nodes.campfire_log.geometry}
            material={materials.campfire_log}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="campfire_log001"
            castShadow
            receiveShadow
            geometry={nodes.campfire_log001.geometry}
            material={materials.campfire_log}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="candle"
            castShadow
            receiveShadow
            geometry={nodes.candle.geometry}
            material={materials.candle}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="chain"
            castShadow
            receiveShadow
            geometry={nodes.chain.geometry}
            material={materials.chain}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="cherry_planks"
            castShadow
            receiveShadow
            geometry={nodes.cherry_planks.geometry}
            material={materials.cherry_planks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="cherry_trapdoor"
            castShadow
            receiveShadow
            geometry={nodes.cherry_trapdoor.geometry}
            material={materials.cherry_trapdoor}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="clay"
            castShadow
            receiveShadow
            geometry={nodes.clay.geometry}
            material={materials.clay}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="cobbled_deepslate"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate.geometry}
            material={materials.cobbled_deepslate}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="cobbled_deepslate001"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate001.geometry}
            material={materials.cobbled_deepslate}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="cobbled_deepslate002"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate002.geometry}
            material={materials.cobbled_deepslate}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="cobblestone"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone.geometry}
            material={materials.cobblestone}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="cobblestone001"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone001.geometry}
            material={materials.cobblestone}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="cobblestone002"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone002.geometry}
            material={materials.cobblestone}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="cobblestone003"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone003.geometry}
            material={materials.cobblestone}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="dark_oak_log"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Grindstone"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone.geometry}
              material={materials.dark_oak_log}
            />
            <mesh
              name="Grindstone_1"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone_1.geometry}
              material={materials.grindstone_side}
            />
            <mesh
              name="Grindstone_2"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone_2.geometry}
              material={materials.grindstone_pivot}
            />
            <mesh
              name="Grindstone_3"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone_3.geometry}
              material={materials.grindstone_round}
            />
          </group>
          <mesh
            name="dark_oak_planks"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks.geometry}
            material={materials.dark_oak_planks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dark_oak_planks001"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks001.geometry}
            material={materials.dark_oak_planks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dead_brain_coral_block"
            castShadow
            receiveShadow
            geometry={nodes.dead_brain_coral_block.geometry}
            material={materials.dead_brain_coral_block}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dead_brain_coral_fan"
            castShadow
            receiveShadow
            geometry={nodes.dead_brain_coral_fan.geometry}
            material={materials.dead_brain_coral_fan}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dead_bubble_coral_fan"
            castShadow
            receiveShadow
            geometry={nodes.dead_bubble_coral_fan.geometry}
            material={materials.dead_bubble_coral_fan}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dead_bush"
            castShadow
            receiveShadow
            geometry={nodes.dead_bush.geometry}
            material={materials.dead_bush}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dead_horn_coral"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral.geometry}
            material={materials.dead_horn_coral}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dead_horn_coral_fan"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral_fan.geometry}
            material={materials.dead_horn_coral_fan}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dead_horn_coral_fan001"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral_fan001.geometry}
            material={materials.dead_horn_coral_fan}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dead_tube_coral_fan"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral_fan.geometry}
            material={materials.dead_tube_coral_fan}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dead_tube_coral_fan001"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral_fan001.geometry}
            material={materials.dead_tube_coral_fan}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="deepslate_bricks001"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks001.geometry}
            material={materials['deepslate_bricks.001']}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="deepslate_bricks002"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks002.geometry}
            material={materials['deepslate_bricks.001']}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="deepslate_bricks003"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks003.geometry}
            material={materials['deepslate_bricks.001']}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="deepslate_tiles001"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles001.geometry}
            material={materials['deepslate_tiles.001']}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="deepslate_tiles002"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles002.geometry}
            material={materials['deepslate_tiles.001']}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="deepslate_tiles003"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles003.geometry}
            material={materials['deepslate_tiles.001']}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="deepslate_tiles004"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles004.geometry}
            material={materials['deepslate_tiles.001']}
            position={[162.871, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="deepslate_top001"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Deepslate001"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate001.geometry}
              material={materials['deepslate_top.001']}
            />
            <mesh
              name="Deepslate001_1"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate001_1.geometry}
              material={materials['deepslate.001']}
            />
          </group>
          <mesh
            name="diorite"
            castShadow
            receiveShadow
            geometry={nodes.diorite.geometry}
            material={materials.diorite}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="diorite001"
            castShadow
            receiveShadow
            geometry={nodes.diorite001.geometry}
            material={materials.diorite}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="diorite002"
            castShadow
            receiveShadow
            geometry={nodes.diorite002.geometry}
            material={materials.diorite}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="diorite003"
            castShadow
            receiveShadow
            geometry={nodes.diorite003.geometry}
            material={materials.diorite}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dirt"
            castShadow
            receiveShadow
            geometry={nodes.dirt.geometry}
            material={materials.dirt}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group name="dirt001" position={[166.653, -191, 361.099]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Flower_Pot"
              castShadow
              receiveShadow
              geometry={nodes.Flower_Pot.geometry}
              material={materials.dirt}
            />
            <mesh
              name="Flower_Pot_1"
              castShadow
              receiveShadow
              geometry={nodes.Flower_Pot_1.geometry}
              material={materials.flower_pot}
            />
          </group>
          <group
            name="dried_kelp_top"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Dried_Kelp_Block"
              castShadow
              receiveShadow
              geometry={nodes.Dried_Kelp_Block.geometry}
              material={materials.dried_kelp_top}
            />
            <mesh
              name="Dried_Kelp_Block_1"
              castShadow
              receiveShadow
              geometry={nodes.Dried_Kelp_Block_1.geometry}
              material={materials.dried_kelp_side}
            />
            <mesh
              name="Dried_Kelp_Block_2"
              castShadow
              receiveShadow
              geometry={nodes.Dried_Kelp_Block_2.geometry}
              material={materials.dried_kelp_bottom}
            />
          </group>
          <mesh
            name="end_rod"
            castShadow
            receiveShadow
            geometry={nodes.end_rod.geometry}
            material={materials.end_rod}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="fern"
            castShadow
            receiveShadow
            geometry={nodes.fern.geometry}
            material={materials.fern}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="glow_lichen"
            castShadow
            receiveShadow
            geometry={nodes.glow_lichen.geometry}
            material={materials.glow_lichen}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="granite"
            castShadow
            receiveShadow
            geometry={nodes.granite.geometry}
            material={materials.granite}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="granite001"
            castShadow
            receiveShadow
            geometry={nodes.granite001.geometry}
            material={materials.granite}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="granite002"
            castShadow
            receiveShadow
            geometry={nodes.granite002.geometry}
            material={materials.granite}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="gravel"
            castShadow
            receiveShadow
            geometry={nodes.gravel.geometry}
            material={materials.gravel}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="gray_candle"
            castShadow
            receiveShadow
            geometry={nodes.gray_candle.geometry}
            material={materials.gray_candle}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="gray_concrete"
            castShadow
            receiveShadow
            geometry={nodes.gray_concrete.geometry}
            material={materials.gray_concrete}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="gray_concrete_powder"
            castShadow
            receiveShadow
            geometry={nodes.gray_concrete_powder.geometry}
            material={materials.gray_concrete_powder}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="gray_wool"
            castShadow
            receiveShadow
            geometry={nodes.gray_wool.geometry}
            material={materials.gray_wool}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="hay_block_side"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Hay_Bale"
              castShadow
              receiveShadow
              geometry={nodes.Hay_Bale.geometry}
              material={materials.hay_block_side}
            />
            <mesh
              name="Hay_Bale_1"
              castShadow
              receiveShadow
              geometry={nodes.Hay_Bale_1.geometry}
              material={materials.hay_block_top}
            />
          </group>
          <mesh
            name="ice"
            castShadow
            receiveShadow
            geometry={nodes.ice.geometry}
            material={materials.ice}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="iron_bars"
            castShadow
            receiveShadow
            geometry={nodes.iron_bars.geometry}
            material={materials.iron_bars}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="iron_block"
            castShadow
            receiveShadow
            geometry={nodes.iron_block.geometry}
            material={materials.iron_block}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="iron_block001"
            castShadow
            receiveShadow
            geometry={nodes.iron_block001.geometry}
            material={materials.iron_block}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="iron_door_top"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Iron_Door"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door.geometry}
              material={materials.iron_door_top}
            />
            <mesh
              name="Iron_Door_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door_1.geometry}
              material={materials.iron_door_bottom}
            />
          </group>
          <mesh
            name="iron_trapdoor"
            castShadow
            receiveShadow
            geometry={nodes.iron_trapdoor.geometry}
            material={materials.iron_trapdoor}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="jungle_planks"
            castShadow
            receiveShadow
            geometry={nodes.jungle_planks.geometry}
            material={materials.jungle_planks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="large_fern_bottom"
            castShadow
            receiveShadow
            geometry={nodes.large_fern_bottom.geometry}
            material={materials.large_fern_bottom}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="lever"
            castShadow
            receiveShadow
            geometry={nodes.lever.geometry}
            material={materials.lever}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="light_gray_concrete_powder"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_concrete_powder.geometry}
            material={materials.light_gray_concrete_powder}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="light_gray_wool"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_wool.geometry}
            material={materials.light_gray_wool}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="lightning_rod"
            castShadow
            receiveShadow
            geometry={nodes.lightning_rod.geometry}
            material={materials.lightning_rod}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group name="loom_top" position={[166.653, -191, 361.099]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Loom"
              castShadow
              receiveShadow
              geometry={nodes.Loom.geometry}
              material={materials.loom_top}
            />
            <mesh
              name="Loom_1"
              castShadow
              receiveShadow
              geometry={nodes.Loom_1.geometry}
              material={materials.loom_side}
            />
            <mesh
              name="Loom_2"
              castShadow
              receiveShadow
              geometry={nodes.Loom_2.geometry}
              material={materials.loom_bottom}
            />
            <mesh
              name="Loom_3"
              castShadow
              receiveShadow
              geometry={nodes.Loom_3.geometry}
              material={materials.loom_front}
            />
          </group>
          <group
            name="mangrove_door_bottom"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Mangrove_Door"
              castShadow
              receiveShadow
              geometry={nodes.Mangrove_Door.geometry}
              material={materials.mangrove_door_bottom}
            />
            <mesh
              name="Mangrove_Door_1"
              castShadow
              receiveShadow
              geometry={nodes.Mangrove_Door_1.geometry}
              material={materials.mangrove_door_top}
            />
          </group>
          <mesh
            name="mangrove_planks"
            castShadow
            receiveShadow
            geometry={nodes.mangrove_planks.geometry}
            material={materials.mangrove_planks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="mangrove_planks001"
            castShadow
            receiveShadow
            geometry={nodes.mangrove_planks001.geometry}
            material={materials.mangrove_planks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="mangrove_planks002"
            castShadow
            receiveShadow
            geometry={nodes.mangrove_planks002.geometry}
            material={materials.mangrove_planks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="mangrove_trapdoor"
            castShadow
            receiveShadow
            geometry={nodes.mangrove_trapdoor.geometry}
            material={materials.mangrove_trapdoor}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="mossy_stone_bricks"
            castShadow
            receiveShadow
            geometry={nodes.mossy_stone_bricks.geometry}
            material={materials.mossy_stone_bricks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="mud_bricks"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks.geometry}
            material={materials.mud_bricks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="mud_bricks001"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks001.geometry}
            material={materials.mud_bricks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="mud_bricks002"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks002.geometry}
            material={materials.mud_bricks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="mushroom_stem"
            castShadow
            receiveShadow
            geometry={nodes.mushroom_stem.geometry}
            material={materials.mushroom_stem}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="oak_door_top"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Oak_Door"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door.geometry}
              material={materials.oak_door_top}
            />
            <mesh
              name="Oak_Door_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door_1.geometry}
              material={materials.oak_door_bottom}
            />
          </group>
          <group
            name="oak_planks"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Bed"
              castShadow
              receiveShadow
              geometry={nodes.Bed.geometry}
              material={materials.oak_planks}
            />
            <mesh
              name="Bed_1"
              castShadow
              receiveShadow
              geometry={nodes.Bed_1.geometry}
              material={materials.MW_bed_feet_top}
            />
            <mesh
              name="Bed_2"
              castShadow
              receiveShadow
              geometry={nodes.Bed_2.geometry}
              material={materials.MW_bed_feet_end}
            />
            <mesh
              name="Bed_3"
              castShadow
              receiveShadow
              geometry={nodes.Bed_3.geometry}
              material={materials.MW_bed_feet_side}
            />
          </group>
          <mesh
            name="oak_planks001"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks001.geometry}
            material={materials.oak_planks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="oak_planks002"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks002.geometry}
            material={materials.oak_planks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="oak_planks003"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Lectern"
              castShadow
              receiveShadow
              geometry={nodes.Lectern.geometry}
              material={materials.oak_planks}
            />
            <mesh
              name="Lectern_1"
              castShadow
              receiveShadow
              geometry={nodes.Lectern_1.geometry}
              material={materials.lectern_top}
            />
            <mesh
              name="Lectern_2"
              castShadow
              receiveShadow
              geometry={nodes.Lectern_2.geometry}
              material={materials.lectern_sides}
            />
            <mesh
              name="Lectern_3"
              castShadow
              receiveShadow
              geometry={nodes.Lectern_3.geometry}
              material={materials.lectern_base}
            />
            <mesh
              name="Lectern_4"
              castShadow
              receiveShadow
              geometry={nodes.Lectern_4.geometry}
              material={materials.lectern_front}
            />
          </group>
          <mesh
            name="oak_planks004"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks004.geometry}
            material={materials.oak_planks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="oak_planks005"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks005.geometry}
            material={materials.oak_planks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="oak_planks006"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks006.geometry}
            material={materials.oak_planks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="oak_planks007"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks007.geometry}
            material={materials.oak_planks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="oak_trapdoor"
            castShadow
            receiveShadow
            geometry={nodes.oak_trapdoor.geometry}
            material={materials.oak_trapdoor}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="pink_wool"
            castShadow
            receiveShadow
            geometry={nodes.pink_wool.geometry}
            material={materials.pink_wool}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="piston_top"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Piston_Head"
              castShadow
              receiveShadow
              geometry={nodes.Piston_Head.geometry}
              material={materials.piston_top}
            />
            <mesh
              name="Piston_Head_1"
              castShadow
              receiveShadow
              geometry={nodes.Piston_Head_1.geometry}
              material={materials.piston_side}
            />
          </group>
          <group
            name="pointed_dripstone_down_tip_merge"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Pointed_Dripstone"
              castShadow
              receiveShadow
              geometry={nodes.Pointed_Dripstone.geometry}
              material={materials.pointed_dripstone_down_tip_merge}
            />
            <mesh
              name="Pointed_Dripstone_1"
              castShadow
              receiveShadow
              geometry={nodes.Pointed_Dripstone_1.geometry}
              material={materials.pointed_dripstone_down_frustum}
            />
          </group>
          <mesh
            name="polished_andesite"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite.geometry}
            material={materials.polished_andesite}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="polished_andesite001"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite001.geometry}
            material={materials.polished_andesite}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="polished_andesite002"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite002.geometry}
            material={materials.polished_andesite}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="polished_deepslate"
            castShadow
            receiveShadow
            geometry={nodes.polished_deepslate.geometry}
            material={materials.polished_deepslate}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="polished_deepslate001"
            castShadow
            receiveShadow
            geometry={nodes.polished_deepslate001.geometry}
            material={materials.polished_deepslate}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="polished_diorite"
            castShadow
            receiveShadow
            geometry={nodes.polished_diorite.geometry}
            material={materials.polished_diorite}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="polished_diorite001"
            castShadow
            receiveShadow
            geometry={nodes.polished_diorite001.geometry}
            material={materials.polished_diorite}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="pumpkin_stem"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Pumpkin_Stem_age_7"
              castShadow
              receiveShadow
              geometry={nodes.Pumpkin_Stem_age_7.geometry}
              material={materials.pumpkin_stem}
            />
            <mesh
              name="Pumpkin_Stem_age_7_1"
              castShadow
              receiveShadow
              geometry={nodes.Pumpkin_Stem_age_7_1.geometry}
              material={materials.attached_pumpkin_stem}
            />
          </group>
          <mesh
            name="purple_wool"
            castShadow
            receiveShadow
            geometry={nodes.purple_wool.geometry}
            material={materials.purple_wool}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="quartz_block_bottom"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Quartz_Slab"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab.geometry}
              material={materials.quartz_block_bottom}
            />
            <mesh
              name="Quartz_Slab_1"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab_1.geometry}
              material={materials.quartz_block_side}
            />
            <mesh
              name="Quartz_Slab_2"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab_2.geometry}
              material={materials.quartz_block_top}
            />
          </group>
          <mesh
            name="quartz_block_bottom001"
            castShadow
            receiveShadow
            geometry={nodes.quartz_block_bottom001.geometry}
            material={materials.quartz_block_bottom}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="quartz_block_bottom002"
            castShadow
            receiveShadow
            geometry={nodes.quartz_block_bottom002.geometry}
            material={materials.quartz_block_bottom}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="quartz_block_side"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Block_of_Quartz"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz.geometry}
              material={materials.quartz_block_side}
            />
            <mesh
              name="Block_of_Quartz_1"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz_1.geometry}
              material={materials.quartz_block_top}
            />
            <mesh
              name="Block_of_Quartz_2"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz_2.geometry}
              material={materials.quartz_bricks}
            />
          </group>
          <mesh
            name="quartz_block_top"
            castShadow
            receiveShadow
            geometry={nodes.quartz_block_top.geometry}
            material={materials.quartz_block_top}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="quartz_block_top001"
            castShadow
            receiveShadow
            geometry={nodes.quartz_block_top001.geometry}
            material={materials.quartz_block_top}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="rail"
            castShadow
            receiveShadow
            geometry={nodes.rail.geometry}
            material={materials.rail}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="red_terracotta"
            castShadow
            receiveShadow
            geometry={nodes.red_terracotta.geometry}
            material={materials.red_terracotta}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="rooted_dirt"
            castShadow
            receiveShadow
            geometry={nodes.rooted_dirt.geometry}
            material={materials.rooted_dirt}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="sand"
            castShadow
            receiveShadow
            geometry={nodes.sand.geometry}
            material={materials.sand}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="sandstone"
            castShadow
            receiveShadow
            geometry={nodes.sandstone.geometry}
            material={materials.sandstone}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="sandstone_top"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Sandstone_Slab"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone_Slab.geometry}
              material={materials.sandstone_top}
            />
            <mesh
              name="Sandstone_Slab_1"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone_Slab_1.geometry}
              material={materials.sandstone}
            />
            <mesh
              name="Sandstone_Slab_2"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone_Slab_2.geometry}
              material={materials.sandstone_bottom}
            />
          </group>
          <group
            name="scaffolding_side"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Scaffolding"
              castShadow
              receiveShadow
              geometry={nodes.Scaffolding.geometry}
              material={materials.scaffolding_side}
            />
            <mesh
              name="Scaffolding_1"
              castShadow
              receiveShadow
              geometry={nodes.Scaffolding_1.geometry}
              material={materials.scaffolding_bottom}
            />
          </group>
          <group
            name="shulker_side_white"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="White_Shulker_Box"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box.geometry}
              material={materials.shulker_side_white}
            />
            <mesh
              name="White_Shulker_Box_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box_1.geometry}
              material={materials.shulker_bottom_white}
            />
          </group>
          <mesh
            name="smooth_stone"
            castShadow
            receiveShadow
            geometry={nodes.smooth_stone.geometry}
            material={materials.smooth_stone}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="smooth_stone001"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Stone_Slab001"
              castShadow
              receiveShadow
              geometry={nodes.Stone_Slab001.geometry}
              material={materials.smooth_stone}
            />
            <mesh
              name="Stone_Slab001_1"
              castShadow
              receiveShadow
              geometry={nodes.Stone_Slab001_1.geometry}
              material={materials.smooth_stone_slab_side}
            />
          </group>
          <mesh
            name="snow"
            castShadow
            receiveShadow
            geometry={nodes.snow.geometry}
            material={materials.snow}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="snow001"
            castShadow
            receiveShadow
            geometry={nodes.snow001.geometry}
            material={materials.snow}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="spruce_planks"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks.geometry}
            material={materials.spruce_planks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="spruce_planks001"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks001.geometry}
            material={materials.spruce_planks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="stone"
            castShadow
            receiveShadow
            geometry={nodes.stone.geometry}
            material={materials.stone}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="stone001"
            castShadow
            receiveShadow
            geometry={nodes.stone001.geometry}
            material={materials.stone}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="stone002"
            castShadow
            receiveShadow
            geometry={nodes.stone002.geometry}
            material={materials.stone}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="stone003"
            castShadow
            receiveShadow
            geometry={nodes.stone003.geometry}
            material={materials.stone}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="stone_bricks"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks.geometry}
            material={materials.stone_bricks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="stone_bricks001"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks001.geometry}
            material={materials.stone_bricks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="stone_bricks002"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks002.geometry}
            material={materials.stone_bricks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="stone_bricks003"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks003.geometry}
            material={materials.stone_bricks}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="stripped_acacia_log"
            castShadow
            receiveShadow
            geometry={nodes.stripped_acacia_log.geometry}
            material={materials.stripped_acacia_log}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="stripped_birch_log"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Stripped_Birch_Log"
              castShadow
              receiveShadow
              geometry={nodes.Stripped_Birch_Log.geometry}
              material={materials.stripped_birch_log}
            />
            <mesh
              name="Stripped_Birch_Log_1"
              castShadow
              receiveShadow
              geometry={nodes.Stripped_Birch_Log_1.geometry}
              material={materials.stripped_birch_log_top}
            />
          </group>
          <mesh
            name="stripped_birch_log001"
            castShadow
            receiveShadow
            geometry={nodes.stripped_birch_log001.geometry}
            material={materials.stripped_birch_log}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="stripped_mangrove_log"
            castShadow
            receiveShadow
            geometry={nodes.stripped_mangrove_log.geometry}
            material={materials.stripped_mangrove_log}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="stripped_oak_log"
            castShadow
            receiveShadow
            geometry={nodes.stripped_oak_log.geometry}
            material={materials.stripped_oak_log}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="stripped_spruce_log"
            castShadow
            receiveShadow
            geometry={nodes.stripped_spruce_log.geometry}
            material={materials.stripped_spruce_log}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="stripped_warped_stem"
            castShadow
            receiveShadow
            geometry={nodes.stripped_warped_stem.geometry}
            material={materials.stripped_warped_stem}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="tall_grass_bottom"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Tall_Grass"
              castShadow
              receiveShadow
              geometry={nodes.Tall_Grass.geometry}
              material={materials.tall_grass_bottom}
            />
            <mesh
              name="Tall_Grass_1"
              castShadow
              receiveShadow
              geometry={nodes.Tall_Grass_1.geometry}
              material={materials.tall_grass_top}
            />
          </group>
          <mesh
            name="tripwire_hook"
            castShadow
            receiveShadow
            geometry={nodes.tripwire_hook.geometry}
            material={materials.tripwire_hook}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="tuff"
            castShadow
            receiveShadow
            geometry={nodes.tuff.geometry}
            material={materials.tuff}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="warped_fungus"
            castShadow
            receiveShadow
            geometry={nodes.warped_fungus.geometry}
            material={materials.warped_fungus}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="white_candle"
            castShadow
            receiveShadow
            geometry={nodes.white_candle.geometry}
            material={materials.white_candle}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="white_concrete_powder"
            castShadow
            receiveShadow
            geometry={nodes.white_concrete_powder.geometry}
            material={materials.white_concrete_powder}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="white_stained_glass"
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="White_Stained_Glass_Pane"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane.geometry}
              material={materials.white_stained_glass}
            />
            <mesh
              name="White_Stained_Glass_Pane_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane_1.geometry}
              material={materials.white_stained_glass_pane_top}
            />
          </group>
          <mesh
            name="white_wool"
            castShadow
            receiveShadow
            geometry={nodes.white_wool.geometry}
            material={materials.white_wool}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="white_wool001"
            castShadow
            receiveShadow
            geometry={nodes.white_wool001.geometry}
            material={materials.white_wool}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="wither_rose"
            castShadow
            receiveShadow
            geometry={nodes.wither_rose.geometry}
            material={materials.wither_rose}
            position={[166.653, -191, 361.099]}
            rotation={[Math.PI / 2, 0, 0]}
          />
        </group>
        <group name="(2)_mcprep_empty002" position={[-0.5, 191, 0]}>
          <mesh
            name="acacia_log001"
            castShadow
            receiveShadow
            geometry={nodes.acacia_log001.geometry}
            material={materials['acacia_log.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="acacia_log002"
            castShadow
            receiveShadow
            geometry={nodes.acacia_log002.geometry}
            material={materials['acacia_log.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="acacia_planks001"
            castShadow
            receiveShadow
            geometry={nodes.acacia_planks001.geometry}
            material={materials['acacia_planks.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="andesite004"
            castShadow
            receiveShadow
            geometry={nodes.andesite004.geometry}
            material={materials['andesite.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="andesite005"
            castShadow
            receiveShadow
            geometry={nodes.andesite005.geometry}
            material={materials['andesite.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="andesite006"
            castShadow
            receiveShadow
            geometry={nodes.andesite006.geometry}
            material={materials['andesite.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="andesite007"
            castShadow
            receiveShadow
            geometry={nodes.andesite007.geometry}
            material={materials['andesite.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="andesite008"
            castShadow
            receiveShadow
            geometry={nodes.andesite008.geometry}
            material={materials['andesite.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="andesite009"
            castShadow
            receiveShadow
            geometry={nodes.andesite009.geometry}
            material={materials['andesite.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="andesite010"
            castShadow
            receiveShadow
            geometry={nodes.andesite010.geometry}
            material={materials['andesite.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="andesite011"
            castShadow
            receiveShadow
            geometry={nodes.andesite011.geometry}
            material={materials['andesite.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="andesite012"
            castShadow
            receiveShadow
            geometry={nodes.andesite012.geometry}
            material={materials['andesite.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="bedrock001"
            castShadow
            receiveShadow
            geometry={nodes.bedrock001.geometry}
            material={materials['bedrock.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="bedrock002"
            castShadow
            receiveShadow
            geometry={nodes.bedrock002.geometry}
            material={materials['bedrock.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="birch_planks003"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks003.geometry}
            material={materials['birch_planks.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="birch_planks004"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks004.geometry}
            material={materials['birch_planks.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="birch_planks005"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks005.geometry}
            material={materials['birch_planks.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="birch_planks006"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks006.geometry}
            material={materials['birch_planks.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="birch_planks007"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks007.geometry}
            material={materials['birch_planks.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="black_wool001"
            castShadow
            receiveShadow
            geometry={nodes.black_wool001.geometry}
            material={materials['black_wool.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="black_wool002"
            castShadow
            receiveShadow
            geometry={nodes.black_wool002.geometry}
            material={materials['black_wool.001']}
            position={[-233.005, -187.894, -116.953]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="blackstone001"
            castShadow
            receiveShadow
            geometry={nodes.blackstone001.geometry}
            material={materials['blackstone.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="blackstone002"
            castShadow
            receiveShadow
            geometry={nodes.blackstone002.geometry}
            material={materials['blackstone.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="blue_concrete_powder001"
            position={[1.049, -191, 148.529]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="blue_concrete_powder002"
            castShadow
            receiveShadow
            geometry={nodes.blue_concrete_powder002.geometry}
            material={materials['blue_concrete_powder.001']}
            position={[-140.338, -168.119, -17.052]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="blue_ice"
            castShadow
            receiveShadow
            geometry={nodes.blue_ice.geometry}
            material={materials.blue_ice}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="blue_ice001"
            castShadow
            receiveShadow
            geometry={nodes.blue_ice001.geometry}
            material={materials.blue_ice}
            position={[7.133, -191, 87.96]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="bone_block_side001"
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Bone_Block001"
              castShadow
              receiveShadow
              geometry={nodes.Bone_Block001.geometry}
              material={materials['bone_block_side.001']}
            />
            <mesh
              name="Bone_Block001_1"
              castShadow
              receiveShadow
              geometry={nodes.Bone_Block001_1.geometry}
              material={materials['bone_block_top.001']}
            />
          </group>
          <group
            name="bone_block_side002"
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Bone_Block002"
              castShadow
              receiveShadow
              geometry={nodes.Bone_Block002.geometry}
              material={materials['bone_block_side.001']}
            />
            <mesh
              name="Bone_Block002_1"
              castShadow
              receiveShadow
              geometry={nodes.Bone_Block002_1.geometry}
              material={materials['bone_block_top.001']}
            />
          </group>
          <group
            name="brown_concrete_powder001"
            position={[1.049, -191, 148.529]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="brown_concrete_powder002"
            castShadow
            receiveShadow
            geometry={nodes.brown_concrete_powder002.geometry}
            material={materials['brown_concrete_powder.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="brown_mushroom001"
            castShadow
            receiveShadow
            geometry={nodes.brown_mushroom001.geometry}
            material={materials['brown_mushroom.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="brown_mushroom002"
            castShadow
            receiveShadow
            geometry={nodes.brown_mushroom002.geometry}
            material={materials['brown_mushroom.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="brown_mushroom_block001"
            castShadow
            receiveShadow
            geometry={nodes.brown_mushroom_block001.geometry}
            material={materials['brown_mushroom_block.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="brown_mushroom_block002"
            castShadow
            receiveShadow
            geometry={nodes.brown_mushroom_block002.geometry}
            material={materials['brown_mushroom_block.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="calcite001"
            castShadow
            receiveShadow
            geometry={nodes.calcite001.geometry}
            material={materials['calcite.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="calcite002"
            castShadow
            receiveShadow
            geometry={nodes.calcite002.geometry}
            material={materials['calcite.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="chain001"
            castShadow
            receiveShadow
            geometry={nodes.chain001.geometry}
            material={materials['chain.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="chain002"
            castShadow
            receiveShadow
            geometry={nodes.chain002.geometry}
            material={materials['chain.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="cherry_planks001"
            castShadow
            receiveShadow
            geometry={nodes.cherry_planks001.geometry}
            material={materials['cherry_planks.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cherry_planks002"
            castShadow
            receiveShadow
            geometry={nodes.cherry_planks002.geometry}
            material={materials['cherry_planks.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cherry_planks003"
            castShadow
            receiveShadow
            geometry={nodes.cherry_planks003.geometry}
            material={materials['cherry_planks.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="cherry_planks004"
            castShadow
            receiveShadow
            geometry={nodes.cherry_planks004.geometry}
            material={materials['cherry_planks.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="cherry_trapdoor001"
            position={[1.049, -191, 148.529]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cherry_trapdoor002"
            castShadow
            receiveShadow
            geometry={nodes.cherry_trapdoor002.geometry}
            material={materials['cherry_trapdoor.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="clay001"
            castShadow
            receiveShadow
            geometry={nodes.clay001.geometry}
            material={materials['clay.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="clay002"
            castShadow
            receiveShadow
            geometry={nodes.clay002.geometry}
            material={materials['clay.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="cobbled_deepslate003"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate003.geometry}
            material={materials['cobbled_deepslate.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobbled_deepslate004"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate004.geometry}
            material={materials['cobbled_deepslate.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobbled_deepslate005"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate005.geometry}
            material={materials['cobbled_deepslate.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobbled_deepslate006"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate006.geometry}
            material={materials['cobbled_deepslate.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobbled_deepslate007"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate007.geometry}
            material={materials['cobbled_deepslate.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="cobbled_deepslate008"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate008.geometry}
            material={materials['cobbled_deepslate.001']}
            position={[7.133, -191, 87.96]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="cobblestone004"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone004.geometry}
            material={materials['cobblestone.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobblestone005"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone005.geometry}
            material={materials['cobblestone.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobblestone006"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone006.geometry}
            material={materials['cobblestone.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobblestone007"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone007.geometry}
            material={materials['cobblestone.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobblestone008"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone008.geometry}
            material={materials['cobblestone.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="cobblestone009"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone009.geometry}
            material={materials['cobblestone.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="cobblestone010"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone010.geometry}
            material={materials['cobblestone.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="dark_oak_log001"
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Grindstone001"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone001.geometry}
              material={materials['dark_oak_log.001']}
            />
            <mesh
              name="Grindstone001_1"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone001_1.geometry}
              material={materials['grindstone_side.001']}
            />
            <mesh
              name="Grindstone001_2"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone001_2.geometry}
              material={materials['grindstone_pivot.001']}
            />
            <mesh
              name="Grindstone001_3"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone001_3.geometry}
              material={materials['grindstone_round.001']}
            />
          </group>
          <group
            name="dark_oak_log002"
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Grindstone002"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone002.geometry}
              material={materials['dark_oak_log.001']}
            />
            <mesh
              name="Grindstone002_1"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone002_1.geometry}
              material={materials['grindstone_side.001']}
            />
            <mesh
              name="Grindstone002_2"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone002_2.geometry}
              material={materials['grindstone_pivot.001']}
            />
            <mesh
              name="Grindstone002_3"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone002_3.geometry}
              material={materials['grindstone_round.001']}
            />
          </group>
          <mesh
            name="dark_oak_planks002"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks002.geometry}
            material={materials['dark_oak_planks.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dark_oak_planks003"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks003.geometry}
            material={materials['dark_oak_planks.001']}
            position={[7.133, -191, 87.96]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="dead_brain_coral_block001"
            castShadow
            receiveShadow
            geometry={nodes.dead_brain_coral_block001.geometry}
            material={materials['dead_brain_coral_block.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_brain_coral_block002"
            castShadow
            receiveShadow
            geometry={nodes.dead_brain_coral_block002.geometry}
            material={materials['dead_brain_coral_block.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="dead_brain_coral_fan001"
            position={[1.049, -191, 148.529]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_brain_coral_fan002"
            castShadow
            receiveShadow
            geometry={nodes.dead_brain_coral_fan002.geometry}
            material={materials['dead_brain_coral_fan.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="dead_bubble_coral_fan001"
            castShadow
            receiveShadow
            geometry={nodes.dead_bubble_coral_fan001.geometry}
            material={materials['dead_bubble_coral_fan.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_fire_coral"
            castShadow
            receiveShadow
            geometry={nodes.dead_fire_coral.geometry}
            material={materials.dead_fire_coral}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_horn_coral001"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral001.geometry}
            material={materials['dead_horn_coral.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_horn_coral_fan002"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral_fan002.geometry}
            material={materials['dead_horn_coral_fan.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_horn_coral_fan003"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral_fan003.geometry}
            material={materials['dead_horn_coral_fan.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_horn_coral_fan004"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral_fan004.geometry}
            material={materials['dead_horn_coral_fan.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="dead_horn_coral_fan005"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral_fan005.geometry}
            material={materials['dead_horn_coral_fan.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="dead_tube_coral"
            position={[1.049, -191, 148.529]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_tube_coral001"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral001.geometry}
            material={materials.dead_tube_coral}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="dead_tube_coral_fan002"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral_fan002.geometry}
            material={materials['dead_tube_coral_fan.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_tube_coral_fan003"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral_fan003.geometry}
            material={materials['dead_tube_coral_fan.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_tube_coral_fan004"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral_fan004.geometry}
            material={materials['dead_tube_coral_fan.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="deepslate_bricks004"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks004.geometry}
            material={materials['deepslate_bricks.002']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="deepslate_bricks005"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks005.geometry}
            material={materials['deepslate_bricks.002']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="deepslate_bricks006"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks006.geometry}
            material={materials['deepslate_bricks.002']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="deepslate_tiles005"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles005.geometry}
            material={materials['deepslate_tiles.002']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="deepslate_tiles006"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles006.geometry}
            material={materials['deepslate_tiles.002']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="deepslate_tiles007"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles007.geometry}
            material={materials['deepslate_tiles.002']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="deepslate_top002"
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Deepslate002"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate002.geometry}
              material={materials['deepslate_top.002']}
            />
            <mesh
              name="Deepslate002_1"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate002_1.geometry}
              material={materials['deepslate.002']}
            />
          </group>
          <group
            name="deepslate_top003"
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Deepslate003"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate003.geometry}
              material={materials['deepslate_top.002']}
            />
            <mesh
              name="Deepslate003_1"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate003_1.geometry}
              material={materials['deepslate.002']}
            />
          </group>
          <mesh
            name="diorite004"
            castShadow
            receiveShadow
            geometry={nodes.diorite004.geometry}
            material={materials['diorite.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="diorite005"
            castShadow
            receiveShadow
            geometry={nodes.diorite005.geometry}
            material={materials['diorite.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="diorite006"
            castShadow
            receiveShadow
            geometry={nodes.diorite006.geometry}
            material={materials['diorite.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="diorite007"
            castShadow
            receiveShadow
            geometry={nodes.diorite007.geometry}
            material={materials['diorite.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="diorite008"
            position={[1.049, -191, 148.529]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="diorite009"
            castShadow
            receiveShadow
            geometry={nodes.diorite009.geometry}
            material={materials['diorite.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="diorite010"
            castShadow
            receiveShadow
            geometry={nodes.diorite010.geometry}
            material={materials['diorite.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="diorite011"
            castShadow
            receiveShadow
            geometry={nodes.diorite011.geometry}
            material={materials['diorite.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="diorite012"
            castShadow
            receiveShadow
            geometry={nodes.diorite012.geometry}
            material={materials['diorite.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="diorite013"
            castShadow
            receiveShadow
            geometry={nodes.diorite013.geometry}
            material={materials['diorite.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="dirt002"
            castShadow
            receiveShadow
            geometry={nodes.dirt002.geometry}
            material={materials['dirt.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="dirt003"
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Flower_Pot001"
              castShadow
              receiveShadow
              geometry={nodes.Flower_Pot001.geometry}
              material={materials['dirt.001']}
            />
            <mesh
              name="Flower_Pot001_1"
              castShadow
              receiveShadow
              geometry={nodes.Flower_Pot001_1.geometry}
              material={materials['flower_pot.001']}
            />
          </group>
          <mesh
            name="dirt004"
            castShadow
            receiveShadow
            geometry={nodes.dirt004.geometry}
            material={materials['dirt.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="dried_kelp_top001"
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Dried_Kelp_Block001"
              castShadow
              receiveShadow
              geometry={nodes.Dried_Kelp_Block001.geometry}
              material={materials['dried_kelp_top.001']}
            />
            <mesh
              name="Dried_Kelp_Block001_1"
              castShadow
              receiveShadow
              geometry={nodes.Dried_Kelp_Block001_1.geometry}
              material={materials['dried_kelp_side.001']}
            />
            <mesh
              name="Dried_Kelp_Block001_2"
              castShadow
              receiveShadow
              geometry={nodes.Dried_Kelp_Block001_2.geometry}
              material={materials['dried_kelp_bottom.001']}
            />
          </group>
          <group
            name="dried_kelp_top002"
            position={[7.133, -191, 87.96]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Dried_Kelp_Block002"
              castShadow
              receiveShadow
              geometry={nodes.Dried_Kelp_Block002.geometry}
              material={materials['dried_kelp_top.001']}
            />
            <mesh
              name="Dried_Kelp_Block002_1"
              castShadow
              receiveShadow
              geometry={nodes.Dried_Kelp_Block002_1.geometry}
              material={materials['dried_kelp_side.001']}
            />
            <mesh
              name="Dried_Kelp_Block002_2"
              castShadow
              receiveShadow
              geometry={nodes.Dried_Kelp_Block002_2.geometry}
              material={materials['dried_kelp_bottom.001']}
            />
          </group>
          <group
            name="furnace_side"
            position={[1.049, -191, 148.529]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="furnace_side001"
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Furnace001"
              castShadow
              receiveShadow
              geometry={nodes.Furnace001.geometry}
              material={materials.furnace_side}
            />
            <mesh
              name="Furnace001_1"
              castShadow
              receiveShadow
              geometry={nodes.Furnace001_1.geometry}
              material={materials.furnace_top}
            />
          </group>
          <mesh
            name="glow_lichen001"
            castShadow
            receiveShadow
            geometry={nodes.glow_lichen001.geometry}
            material={materials['glow_lichen.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="glow_lichen002"
            castShadow
            receiveShadow
            geometry={nodes.glow_lichen002.geometry}
            material={materials['glow_lichen.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="granite003"
            castShadow
            receiveShadow
            geometry={nodes.granite003.geometry}
            material={materials['granite.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="granite004"
            castShadow
            receiveShadow
            geometry={nodes.granite004.geometry}
            material={materials['granite.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="gravel001"
            castShadow
            receiveShadow
            geometry={nodes.gravel001.geometry}
            material={materials['gravel.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="gravel002"
            castShadow
            receiveShadow
            geometry={nodes.gravel002.geometry}
            material={materials['gravel.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="gray_candle001"
            castShadow
            receiveShadow
            geometry={nodes.gray_candle001.geometry}
            material={materials['gray_candle.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="gray_concrete_powder001"
            position={[1.049, -191, 148.529]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="gray_concrete_powder002"
            castShadow
            receiveShadow
            geometry={nodes.gray_concrete_powder002.geometry}
            material={materials['gray_concrete_powder.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="gray_wool001"
            castShadow
            receiveShadow
            geometry={nodes.gray_wool001.geometry}
            material={materials['gray_wool.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="gray_wool002"
            castShadow
            receiveShadow
            geometry={nodes.gray_wool002.geometry}
            material={materials['gray_wool.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="hay_block_side001"
            position={[1.049, -191, 148.529]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="hay_block_side002"
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Hay_Bale002"
              castShadow
              receiveShadow
              geometry={nodes.Hay_Bale002.geometry}
              material={materials['hay_block_side.001']}
            />
            <mesh
              name="Hay_Bale002_1"
              castShadow
              receiveShadow
              geometry={nodes.Hay_Bale002_1.geometry}
              material={materials['hay_block_top.001']}
            />
          </group>
          <group
            name="hopper_inside"
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Hopper"
              castShadow
              receiveShadow
              geometry={nodes.Hopper.geometry}
              material={materials.hopper_inside}
            />
            <mesh
              name="Hopper_1"
              castShadow
              receiveShadow
              geometry={nodes.Hopper_1.geometry}
              material={materials.hopper_outside}
            />
            <mesh
              name="Hopper_2"
              castShadow
              receiveShadow
              geometry={nodes.Hopper_2.geometry}
              material={materials.hopper_top}
            />
          </group>
          <group
            name="hopper_inside001"
            position={[7.133, -191, 87.96]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Hopper001"
              castShadow
              receiveShadow
              geometry={nodes.Hopper001.geometry}
              material={materials.hopper_inside}
            />
            <mesh
              name="Hopper001_1"
              castShadow
              receiveShadow
              geometry={nodes.Hopper001_1.geometry}
              material={materials.hopper_outside}
            />
            <mesh
              name="Hopper001_2"
              castShadow
              receiveShadow
              geometry={nodes.Hopper001_2.geometry}
              material={materials.hopper_top}
            />
          </group>
          <mesh
            name="ice001"
            castShadow
            receiveShadow
            geometry={nodes.ice001.geometry}
            material={materials['ice.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="ice002"
            castShadow
            receiveShadow
            geometry={nodes.ice002.geometry}
            material={materials['ice.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="iron_bars001"
            castShadow
            receiveShadow
            geometry={nodes.iron_bars001.geometry}
            material={materials['iron_bars.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="iron_block002"
            castShadow
            receiveShadow
            geometry={nodes.iron_block002.geometry}
            material={materials['iron_block.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="iron_block003"
            position={[1.049, -191, 148.529]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="iron_block004"
            castShadow
            receiveShadow
            geometry={nodes.iron_block004.geometry}
            material={materials['iron_block.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="iron_block005"
            castShadow
            receiveShadow
            geometry={nodes.iron_block005.geometry}
            material={materials['iron_block.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="iron_door_top001"
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Iron_Door001"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door001.geometry}
              material={materials['iron_door_top.001']}
            />
            <mesh
              name="Iron_Door001_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door001_1.geometry}
              material={materials['iron_door_bottom.001']}
            />
          </group>
          <group
            name="iron_door_top002"
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Iron_Door002"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door002.geometry}
              material={materials['iron_door_top.001']}
            />
            <mesh
              name="Iron_Door002_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door002_1.geometry}
              material={materials['iron_door_bottom.001']}
            />
          </group>
          <mesh
            name="iron_trapdoor001"
            castShadow
            receiveShadow
            geometry={nodes.iron_trapdoor001.geometry}
            material={materials['iron_trapdoor.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="iron_trapdoor002"
            castShadow
            receiveShadow
            geometry={nodes.iron_trapdoor002.geometry}
            material={materials['iron_trapdoor.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="lever001"
            castShadow
            receiveShadow
            geometry={nodes.lever001.geometry}
            material={materials['lever.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="lever002"
            castShadow
            receiveShadow
            geometry={nodes.lever002.geometry}
            material={materials['lever.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="light_gray_candle"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_candle.geometry}
            material={materials.light_gray_candle}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="light_gray_concrete_powder001"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_concrete_powder001.geometry}
            material={materials['light_gray_concrete_powder.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="light_gray_concrete_powder002"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_concrete_powder002.geometry}
            material={materials['light_gray_concrete_powder.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="loom_side"
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Loom001"
              castShadow
              receiveShadow
              geometry={nodes.Loom001.geometry}
              material={materials['loom_side.001']}
            />
            <mesh
              name="Loom001_1"
              castShadow
              receiveShadow
              geometry={nodes.Loom001_1.geometry}
              material={materials['loom_bottom.001']}
            />
          </group>
          <group
            name="loom_side001"
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Loom002"
              castShadow
              receiveShadow
              geometry={nodes.Loom002.geometry}
              material={materials['loom_side.001']}
            />
            <mesh
              name="Loom002_1"
              castShadow
              receiveShadow
              geometry={nodes.Loom002_1.geometry}
              material={materials['loom_bottom.001']}
            />
          </group>
          <group
            name="mossy_cobblestone"
            position={[1.049, -191, 148.529]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="mossy_cobblestone001"
            castShadow
            receiveShadow
            geometry={nodes.mossy_cobblestone001.geometry}
            material={materials.mossy_cobblestone}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="mud_bricks003"
            position={[1.049, -191, 148.529]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="mud_bricks004"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks004.geometry}
            material={materials['mud_bricks.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="mud_bricks005"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks005.geometry}
            material={materials['mud_bricks.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="mud_bricks006"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks006.geometry}
            material={materials['mud_bricks.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="mushroom_stem001"
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Red_Mushroom_Block001"
              castShadow
              receiveShadow
              geometry={nodes.Red_Mushroom_Block001.geometry}
              material={materials['mushroom_stem.001']}
            />
            <mesh
              name="Red_Mushroom_Block001_1"
              castShadow
              receiveShadow
              geometry={nodes.Red_Mushroom_Block001_1.geometry}
              material={materials.mushroom_block_inside}
            />
          </group>
          <mesh
            name="mushroom_stem002"
            castShadow
            receiveShadow
            geometry={nodes.mushroom_stem002.geometry}
            material={materials['mushroom_stem.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="oak_door_top001"
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Oak_Door001"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door001.geometry}
              material={materials['oak_door_top.001']}
            />
            <mesh
              name="Oak_Door001_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door001_1.geometry}
              material={materials['oak_door_bottom.001']}
            />
          </group>
          <group
            name="oak_door_top002"
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Oak_Door002"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door002.geometry}
              material={materials['oak_door_top.001']}
            />
            <mesh
              name="Oak_Door002_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door002_1.geometry}
              material={materials['oak_door_bottom.001']}
            />
          </group>
          <group
            name="oak_planks008"
            position={[1.049, -191, 148.529]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="oak_planks009"
            position={[1.049, -191, 148.529]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="oak_planks010"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks010.geometry}
            material={materials['oak_planks.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="oak_planks011"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks011.geometry}
            material={materials['oak_planks.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="oak_planks012"
            position={[1.049, -191, 148.529]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="oak_planks013"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks013.geometry}
            material={materials['oak_planks.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="oak_planks014"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks014.geometry}
            material={materials['oak_planks.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="oak_planks015"
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Lectern002"
              castShadow
              receiveShadow
              geometry={nodes.Lectern002.geometry}
              material={materials['oak_planks.001']}
            />
            <mesh
              name="Lectern002_1"
              castShadow
              receiveShadow
              geometry={nodes.Lectern002_1.geometry}
              material={materials['lectern_top.001']}
            />
            <mesh
              name="Lectern002_2"
              castShadow
              receiveShadow
              geometry={nodes.Lectern002_2.geometry}
              material={materials['lectern_sides.001']}
            />
            <mesh
              name="Lectern002_3"
              castShadow
              receiveShadow
              geometry={nodes.Lectern002_3.geometry}
              material={materials['lectern_base.001']}
            />
            <mesh
              name="Lectern002_4"
              castShadow
              receiveShadow
              geometry={nodes.Lectern002_4.geometry}
              material={materials['lectern_front.001']}
            />
          </group>
          <mesh
            name="oak_planks016"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks016.geometry}
            material={materials['oak_planks.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="oak_planks017"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks017.geometry}
            material={materials['oak_planks.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="oak_planks018"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks018.geometry}
            material={materials['oak_planks.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="oak_planks019"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks019.geometry}
            material={materials['oak_planks.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="oak_trapdoor001"
            castShadow
            receiveShadow
            geometry={nodes.oak_trapdoor001.geometry}
            material={materials['oak_trapdoor.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="oak_trapdoor002"
            castShadow
            receiveShadow
            geometry={nodes.oak_trapdoor002.geometry}
            material={materials['oak_trapdoor.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="piston_top001"
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Piston_Head001"
              castShadow
              receiveShadow
              geometry={nodes.Piston_Head001.geometry}
              material={materials['piston_top.001']}
            />
            <mesh
              name="Piston_Head001_1"
              castShadow
              receiveShadow
              geometry={nodes.Piston_Head001_1.geometry}
              material={materials['piston_side.001']}
            />
          </group>
          <group
            name="piston_top002"
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Piston_Head002"
              castShadow
              receiveShadow
              geometry={nodes.Piston_Head002.geometry}
              material={materials['piston_top.001']}
            />
            <mesh
              name="Piston_Head002_1"
              castShadow
              receiveShadow
              geometry={nodes.Piston_Head002_1.geometry}
              material={materials['piston_side.001']}
            />
          </group>
          <mesh
            name="polished_andesite003"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite003.geometry}
            material={materials['polished_andesite.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="polished_andesite004"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite004.geometry}
            material={materials['polished_andesite.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="polished_andesite005"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite005.geometry}
            material={materials['polished_andesite.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="polished_andesite006"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite006.geometry}
            material={materials['polished_andesite.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="polished_andesite007"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite007.geometry}
            material={materials['polished_andesite.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="polished_andesite008"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite008.geometry}
            material={materials['polished_andesite.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="polished_deepslate002"
            castShadow
            receiveShadow
            geometry={nodes.polished_deepslate002.geometry}
            material={materials['polished_deepslate.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="polished_diorite002"
            castShadow
            receiveShadow
            geometry={nodes.polished_diorite002.geometry}
            material={materials['polished_diorite.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="polished_diorite003"
            castShadow
            receiveShadow
            geometry={nodes.polished_diorite003.geometry}
            material={materials['polished_diorite.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="pumpkin_stem001"
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Pumpkin_Stem_age_7001"
              castShadow
              receiveShadow
              geometry={nodes.Pumpkin_Stem_age_7001.geometry}
              material={materials['pumpkin_stem.001']}
            />
            <mesh
              name="Pumpkin_Stem_age_7001_1"
              castShadow
              receiveShadow
              geometry={nodes.Pumpkin_Stem_age_7001_1.geometry}
              material={materials['attached_pumpkin_stem.001']}
            />
          </group>
          <mesh
            name="pumpkin_stem002"
            castShadow
            receiveShadow
            geometry={nodes.pumpkin_stem002.geometry}
            material={materials['pumpkin_stem.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="pumpkin_stem003"
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Pumpkin_Stem_age_7003"
              castShadow
              receiveShadow
              geometry={nodes.Pumpkin_Stem_age_7003.geometry}
              material={materials['pumpkin_stem.001']}
            />
            <mesh
              name="Pumpkin_Stem_age_7003_1"
              castShadow
              receiveShadow
              geometry={nodes.Pumpkin_Stem_age_7003_1.geometry}
              material={materials['attached_pumpkin_stem.001']}
            />
          </group>
          <group
            name="pumpkin_top"
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Skeleton_Wall_Skull"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull.geometry}
              material={materials.pumpkin_top}
            />
            <mesh
              name="Skeleton_Wall_Skull_1"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull_1.geometry}
              material={materials.pumpkin_side}
            />
            <mesh
              name="Skeleton_Wall_Skull_2"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull_2.geometry}
              material={materials.carved_pumpkin}
            />
          </group>
          <group
            name="quartz_block_bottom003"
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Quartz_Slab001"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab001.geometry}
              material={materials['quartz_block_bottom.001']}
            />
            <mesh
              name="Quartz_Slab001_1"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab001_1.geometry}
              material={materials['quartz_block_side.001']}
            />
            <mesh
              name="Quartz_Slab001_2"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab001_2.geometry}
              material={materials['quartz_block_top.001']}
            />
          </group>
          <group
            name="quartz_block_bottom004"
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Quartz_Slab002"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab002.geometry}
              material={materials['quartz_block_bottom.001']}
            />
            <mesh
              name="Quartz_Slab002_1"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab002_1.geometry}
              material={materials['quartz_block_side.001']}
            />
            <mesh
              name="Quartz_Slab002_2"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab002_2.geometry}
              material={materials['quartz_block_top.001']}
            />
          </group>
          <group
            name="quartz_block_side001"
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Block_of_Quartz001"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz001.geometry}
              material={materials['quartz_block_side.001']}
            />
            <mesh
              name="Block_of_Quartz001_1"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz001_1.geometry}
              material={materials['quartz_block_top.001']}
            />
            <mesh
              name="Block_of_Quartz001_2"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz001_2.geometry}
              material={materials['quartz_bricks.001']}
            />
          </group>
          <group
            name="quartz_block_side002"
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Block_of_Quartz002"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz002.geometry}
              material={materials['quartz_block_side.001']}
            />
            <mesh
              name="Block_of_Quartz002_1"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz002_1.geometry}
              material={materials['quartz_block_top.001']}
            />
            <mesh
              name="Block_of_Quartz002_2"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz002_2.geometry}
              material={materials['quartz_bricks.001']}
            />
          </group>
          <group
            name="quartz_block_top002"
            position={[1.049, -191, 148.529]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="quartz_block_top003"
            castShadow
            receiveShadow
            geometry={nodes.quartz_block_top003.geometry}
            material={materials['quartz_block_top.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="quartz_block_top004"
            castShadow
            receiveShadow
            geometry={nodes.quartz_block_top004.geometry}
            material={materials['quartz_block_top.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="rail001"
            castShadow
            receiveShadow
            geometry={nodes.rail001.geometry}
            material={materials['rail.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="redstone_torch_off"
            castShadow
            receiveShadow
            geometry={nodes.redstone_torch_off.geometry}
            material={materials.redstone_torch_off}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="redstone_torch_off001"
            castShadow
            receiveShadow
            geometry={nodes.redstone_torch_off001.geometry}
            material={materials.redstone_torch_off}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="repeater"
            castShadow
            receiveShadow
            geometry={nodes.repeater.geometry}
            material={materials.repeater}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="repeater001"
            castShadow
            receiveShadow
            geometry={nodes.repeater001.geometry}
            material={materials.repeater}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="rooted_dirt001"
            castShadow
            receiveShadow
            geometry={nodes.rooted_dirt001.geometry}
            material={materials['rooted_dirt.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="rooted_dirt002"
            castShadow
            receiveShadow
            geometry={nodes.rooted_dirt002.geometry}
            material={materials['rooted_dirt.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="sand001"
            castShadow
            receiveShadow
            geometry={nodes.sand001.geometry}
            material={materials['sand.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="sand002"
            castShadow
            receiveShadow
            geometry={nodes.sand002.geometry}
            material={materials['sand.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="sandstone001"
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Sandstone001"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone001.geometry}
              material={materials['sandstone.001']}
            />
            <mesh
              name="Sandstone001_1"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone001_1.geometry}
              material={materials['sandstone_bottom.001']}
            />
          </group>
          <mesh
            name="smooth_stone002"
            castShadow
            receiveShadow
            geometry={nodes.smooth_stone002.geometry}
            material={materials['smooth_stone.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="smooth_stone003"
            castShadow
            receiveShadow
            geometry={nodes.smooth_stone003.geometry}
            material={materials['smooth_stone.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="snow002"
            castShadow
            receiveShadow
            geometry={nodes.snow002.geometry}
            material={materials['snow.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="snow003"
            castShadow
            receiveShadow
            geometry={nodes.snow003.geometry}
            material={materials['snow.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="snow004"
            castShadow
            receiveShadow
            geometry={nodes.snow004.geometry}
            material={materials['snow.001']}
            position={[7.133, -191, 87.96]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="snow005"
            castShadow
            receiveShadow
            geometry={nodes.snow005.geometry}
            material={materials['snow.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="spruce_planks002"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks002.geometry}
            material={materials['spruce_planks.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="spruce_planks003"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks003.geometry}
            material={materials['spruce_planks.001']}
            position={[7.133, -191, 87.96]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="stone004"
            castShadow
            receiveShadow
            geometry={nodes.stone004.geometry}
            material={materials['stone.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone005"
            castShadow
            receiveShadow
            geometry={nodes.stone005.geometry}
            material={materials['stone.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone006"
            castShadow
            receiveShadow
            geometry={nodes.stone006.geometry}
            material={materials['stone.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="stone007"
            position={[1.049, -191, 148.529]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone008"
            castShadow
            receiveShadow
            geometry={nodes.stone008.geometry}
            material={materials['stone.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="stone009"
            castShadow
            receiveShadow
            geometry={nodes.stone009.geometry}
            material={materials['stone.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="stone010"
            castShadow
            receiveShadow
            geometry={nodes.stone010.geometry}
            material={materials['stone.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="stone_bricks004"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks004.geometry}
            material={materials['stone_bricks.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone_bricks005"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks005.geometry}
            material={materials['stone_bricks.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone_bricks006"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks006.geometry}
            material={materials['stone_bricks.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone_bricks007"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks007.geometry}
            material={materials['stone_bricks.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone_bricks008"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks008.geometry}
            material={materials['stone_bricks.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="stone_bricks009"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks009.geometry}
            material={materials['stone_bricks.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="stone_bricks010"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks010.geometry}
            material={materials['stone_bricks.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="stripped_spruce_log001"
            castShadow
            receiveShadow
            geometry={nodes.stripped_spruce_log001.geometry}
            material={materials['stripped_spruce_log.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stripped_spruce_log002"
            castShadow
            receiveShadow
            geometry={nodes.stripped_spruce_log002.geometry}
            material={materials['stripped_spruce_log.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="stripped_warped_stem001"
            position={[1.049, -191, 148.529]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stripped_warped_stem002"
            castShadow
            receiveShadow
            geometry={nodes.stripped_warped_stem002.geometry}
            material={materials['stripped_warped_stem.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="tripwire_hook001"
            castShadow
            receiveShadow
            geometry={nodes.tripwire_hook001.geometry}
            material={materials['tripwire_hook.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="tripwire_hook002"
            castShadow
            receiveShadow
            geometry={nodes.tripwire_hook002.geometry}
            material={materials['tripwire_hook.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="tuff001"
            castShadow
            receiveShadow
            geometry={nodes.tuff001.geometry}
            material={materials['tuff.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="tuff002"
            castShadow
            receiveShadow
            geometry={nodes.tuff002.geometry}
            material={materials['tuff.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="warped_fungus001"
            castShadow
            receiveShadow
            geometry={nodes.warped_fungus001.geometry}
            material={materials['warped_fungus.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="white_candle001"
            castShadow
            receiveShadow
            geometry={nodes.white_candle001.geometry}
            material={materials['white_candle.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="white_candle002"
            castShadow
            receiveShadow
            geometry={nodes.white_candle002.geometry}
            material={materials['white_candle.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="white_concrete_powder001"
            castShadow
            receiveShadow
            geometry={nodes.white_concrete_powder001.geometry}
            material={materials['white_concrete_powder.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="white_concrete_powder002"
            castShadow
            receiveShadow
            geometry={nodes.white_concrete_powder002.geometry}
            material={materials['white_concrete_powder.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="white_shulker_box"
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="White_Shulker_Box001"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box001.geometry}
              material={materials.white_shulker_box}
            />
            <mesh
              name="White_Shulker_Box001_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box001_1.geometry}
              material={materials['shulker_side_white.001']}
            />
            <mesh
              name="White_Shulker_Box001_2"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box001_2.geometry}
              material={materials['shulker_bottom_white.001']}
            />
          </group>
          <group
            name="white_shulker_box001"
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="White_Shulker_Box002"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box002.geometry}
              material={materials.white_shulker_box}
            />
            <mesh
              name="White_Shulker_Box002_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box002_1.geometry}
              material={materials['shulker_side_white.001']}
            />
            <mesh
              name="White_Shulker_Box002_2"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box002_2.geometry}
              material={materials['shulker_bottom_white.001']}
            />
          </group>
          <group
            name="white_stained_glass001"
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="White_Stained_Glass_Pane001"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane001.geometry}
              material={materials['white_stained_glass.001']}
            />
            <mesh
              name="White_Stained_Glass_Pane001_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane001_1.geometry}
              material={materials['white_stained_glass_pane_top.001']}
            />
          </group>
          <group
            name="white_stained_glass002"
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="White_Stained_Glass_Pane002"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane002.geometry}
              material={materials['white_stained_glass.001']}
            />
            <mesh
              name="White_Stained_Glass_Pane002_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane002_1.geometry}
              material={materials['white_stained_glass_pane_top.001']}
            />
          </group>
          <mesh
            name="white_wool002"
            castShadow
            receiveShadow
            geometry={nodes.white_wool002.geometry}
            material={materials['white_wool.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="white_wool003"
            castShadow
            receiveShadow
            geometry={nodes.white_wool003.geometry}
            material={materials['white_wool.001']}
            position={[-7.336, -191, 394.259]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="white_wool004"
            castShadow
            receiveShadow
            geometry={nodes.white_wool004.geometry}
            material={materials['white_wool.001']}
            position={[7.133, -191, 106.578]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="white_wool005"
            castShadow
            receiveShadow
            geometry={nodes.white_wool005.geometry}
            material={materials['white_wool.001']}
            position={[7.133, -191, 87.96]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
        </group>
        <group name="(2)_mcprep_empty003" position={[-0.5, 191, 0]}>
          <mesh
            name="acacia_log003"
            castShadow
            receiveShadow
            geometry={nodes.acacia_log003.geometry}
            material={materials['acacia_log.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="acacia_log007"
            castShadow
            receiveShadow
            geometry={nodes.acacia_log007.geometry}
            material={materials['acacia_log.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="acacia_planks002"
            castShadow
            receiveShadow
            geometry={nodes.acacia_planks002.geometry}
            material={materials['acacia_planks.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="acacia_planks003"
            castShadow
            receiveShadow
            geometry={nodes.acacia_planks003.geometry}
            material={materials['acacia_planks.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="andesite013"
            castShadow
            receiveShadow
            geometry={nodes.andesite013.geometry}
            material={materials['andesite.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="andesite014"
            castShadow
            receiveShadow
            geometry={nodes.andesite014.geometry}
            material={materials['andesite.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="andesite015"
            castShadow
            receiveShadow
            geometry={nodes.andesite015.geometry}
            material={materials['andesite.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="andesite016"
            castShadow
            receiveShadow
            geometry={nodes.andesite016.geometry}
            material={materials['andesite.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="andesite017"
            castShadow
            receiveShadow
            geometry={nodes.andesite017.geometry}
            material={materials['andesite.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="andesite033"
            castShadow
            receiveShadow
            geometry={nodes.andesite033.geometry}
            material={materials['andesite.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="andesite034"
            castShadow
            receiveShadow
            geometry={nodes.andesite034.geometry}
            material={materials['andesite.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="andesite035"
            castShadow
            receiveShadow
            geometry={nodes.andesite035.geometry}
            material={materials['andesite.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="andesite036"
            castShadow
            receiveShadow
            geometry={nodes.andesite036.geometry}
            material={materials['andesite.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="andesite037"
            castShadow
            receiveShadow
            geometry={nodes.andesite037.geometry}
            material={materials['andesite.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="bedrock003"
            castShadow
            receiveShadow
            geometry={nodes.bedrock003.geometry}
            material={materials['bedrock.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="bedrock007"
            castShadow
            receiveShadow
            geometry={nodes.bedrock007.geometry}
            material={materials['bedrock.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="birch_planks008"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks008.geometry}
            material={materials['birch_planks.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="birch_planks009"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks009.geometry}
            material={materials['birch_planks.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="birch_planks010"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks010.geometry}
            material={materials['birch_planks.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="birch_planks025"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks025.geometry}
            material={materials['birch_planks.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="birch_planks026"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks026.geometry}
            material={materials['birch_planks.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="birch_planks027"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks027.geometry}
            material={materials['birch_planks.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="black_wool003"
            castShadow
            receiveShadow
            geometry={nodes.black_wool003.geometry}
            material={materials['black_wool.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="black_wool005"
            castShadow
            receiveShadow
            geometry={nodes.black_wool005.geometry}
            material={materials['black_wool.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="blackstone003"
            castShadow
            receiveShadow
            geometry={nodes.blackstone003.geometry}
            material={materials['blackstone.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="blackstone005"
            castShadow
            receiveShadow
            geometry={nodes.blackstone005.geometry}
            material={materials['blackstone.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="blue_ice002"
            castShadow
            receiveShadow
            geometry={nodes.blue_ice002.geometry}
            material={materials['blue_ice.001']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="blue_ice006"
            castShadow
            receiveShadow
            geometry={nodes.blue_ice006.geometry}
            material={materials['blue_ice.001']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="bone_block_side003"
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Bone_Block003"
              castShadow
              receiveShadow
              geometry={nodes.Bone_Block003.geometry}
              material={materials['bone_block_side.002']}
            />
            <mesh
              name="Bone_Block003_1"
              castShadow
              receiveShadow
              geometry={nodes.Bone_Block003_1.geometry}
              material={materials['bone_block_top.002']}
            />
          </group>
          <group
            name="bone_block_side007"
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Bone_Block007"
              castShadow
              receiveShadow
              geometry={nodes.Bone_Block007.geometry}
              material={materials['bone_block_side.002']}
            />
            <mesh
              name="Bone_Block007_1"
              castShadow
              receiveShadow
              geometry={nodes.Bone_Block007_1.geometry}
              material={materials['bone_block_top.002']}
            />
          </group>
          <mesh
            name="brown_mushroom003"
            castShadow
            receiveShadow
            geometry={nodes.brown_mushroom003.geometry}
            material={materials['brown_mushroom.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="brown_mushroom007"
            castShadow
            receiveShadow
            geometry={nodes.brown_mushroom007.geometry}
            material={materials['brown_mushroom.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="brown_mushroom_block003"
            castShadow
            receiveShadow
            geometry={nodes.brown_mushroom_block003.geometry}
            material={materials['brown_mushroom_block.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="brown_mushroom_block005"
            castShadow
            receiveShadow
            geometry={nodes.brown_mushroom_block005.geometry}
            material={materials['brown_mushroom_block.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="calcite003"
            castShadow
            receiveShadow
            geometry={nodes.calcite003.geometry}
            material={materials['calcite.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="calcite007"
            castShadow
            receiveShadow
            geometry={nodes.calcite007.geometry}
            material={materials['calcite.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="chain003"
            castShadow
            receiveShadow
            geometry={nodes.chain003.geometry}
            material={materials['chain.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="chain007"
            castShadow
            receiveShadow
            geometry={nodes.chain007.geometry}
            material={materials['chain.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cherry_planks005"
            castShadow
            receiveShadow
            geometry={nodes.cherry_planks005.geometry}
            material={materials['cherry_planks.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cherry_planks006"
            castShadow
            receiveShadow
            geometry={nodes.cherry_planks006.geometry}
            material={materials['cherry_planks.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cherry_planks010"
            castShadow
            receiveShadow
            geometry={nodes.cherry_planks010.geometry}
            material={materials['cherry_planks.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cherry_planks011"
            castShadow
            receiveShadow
            geometry={nodes.cherry_planks011.geometry}
            material={materials['cherry_planks.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="clay003"
            castShadow
            receiveShadow
            geometry={nodes.clay003.geometry}
            material={materials['clay.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="clay007"
            castShadow
            receiveShadow
            geometry={nodes.clay007.geometry}
            material={materials['clay.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobbled_deepslate009"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate009.geometry}
            material={materials['cobbled_deepslate.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobbled_deepslate010"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate010.geometry}
            material={materials['cobbled_deepslate.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobbled_deepslate011"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate011.geometry}
            material={materials['cobbled_deepslate.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobbled_deepslate012"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate012.geometry}
            material={materials['cobbled_deepslate.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobbled_deepslate023"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate023.geometry}
            material={materials['cobbled_deepslate.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobbled_deepslate024"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate024.geometry}
            material={materials['cobbled_deepslate.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobbled_deepslate025"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate025.geometry}
            material={materials['cobbled_deepslate.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobbled_deepslate026"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate026.geometry}
            material={materials['cobbled_deepslate.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobblestone011"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone011.geometry}
            material={materials['cobblestone.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobblestone012"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone012.geometry}
            material={materials['cobblestone.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobblestone013"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone013.geometry}
            material={materials['cobblestone.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobblestone014"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone014.geometry}
            material={materials['cobblestone.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobblestone025"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone025.geometry}
            material={materials['cobblestone.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobblestone026"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone026.geometry}
            material={materials['cobblestone.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobblestone027"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone027.geometry}
            material={materials['cobblestone.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="cobblestone028"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone028.geometry}
            material={materials['cobblestone.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="dark_oak_log003"
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Grindstone003"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone003.geometry}
              material={materials['dark_oak_log.002']}
            />
            <mesh
              name="Grindstone003_1"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone003_1.geometry}
              material={materials['grindstone_side.002']}
            />
            <mesh
              name="Grindstone003_2"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone003_2.geometry}
              material={materials['grindstone_pivot.002']}
            />
            <mesh
              name="Grindstone003_3"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone003_3.geometry}
              material={materials['grindstone_round.002']}
            />
          </group>
          <group
            name="dark_oak_log007"
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Grindstone007"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone007.geometry}
              material={materials['dark_oak_log.002']}
            />
            <mesh
              name="Grindstone007_1"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone007_1.geometry}
              material={materials['grindstone_side.002']}
            />
            <mesh
              name="Grindstone007_2"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone007_2.geometry}
              material={materials['grindstone_pivot.002']}
            />
            <mesh
              name="Grindstone007_3"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone007_3.geometry}
              material={materials['grindstone_round.002']}
            />
          </group>
          <mesh
            name="dark_oak_planks004"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks004.geometry}
            material={materials['dark_oak_planks.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dark_oak_planks011"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks011.geometry}
            material={materials['dark_oak_planks.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_brain_coral_block003"
            castShadow
            receiveShadow
            geometry={nodes.dead_brain_coral_block003.geometry}
            material={materials['dead_brain_coral_block.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_brain_coral_block007"
            castShadow
            receiveShadow
            geometry={nodes.dead_brain_coral_block007.geometry}
            material={materials['dead_brain_coral_block.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_bubble_coral_fan002"
            castShadow
            receiveShadow
            geometry={nodes.dead_bubble_coral_fan002.geometry}
            material={materials['dead_bubble_coral_fan.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_bubble_coral_fan007"
            castShadow
            receiveShadow
            geometry={nodes.dead_bubble_coral_fan007.geometry}
            material={materials['dead_bubble_coral_fan.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_fire_coral001"
            castShadow
            receiveShadow
            geometry={nodes.dead_fire_coral001.geometry}
            material={materials['dead_fire_coral.001']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_fire_coral004"
            castShadow
            receiveShadow
            geometry={nodes.dead_fire_coral004.geometry}
            material={materials['dead_fire_coral.001']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_horn_coral002"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral002.geometry}
            material={materials['dead_horn_coral.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_horn_coral006"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral006.geometry}
            material={materials['dead_horn_coral.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_horn_coral_fan006"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral_fan006.geometry}
            material={materials['dead_horn_coral_fan.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_horn_coral_fan007"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral_fan007.geometry}
            material={materials['dead_horn_coral_fan.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_horn_coral_fan014"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral_fan014.geometry}
            material={materials['dead_horn_coral_fan.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_horn_coral_fan015"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral_fan015.geometry}
            material={materials['dead_horn_coral_fan.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_tube_coral_fan005"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral_fan005.geometry}
            material={materials['dead_tube_coral_fan.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_tube_coral_fan006"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral_fan006.geometry}
            material={materials['dead_tube_coral_fan.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_tube_coral_fan013"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral_fan013.geometry}
            material={materials['dead_tube_coral_fan.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dead_tube_coral_fan014"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral_fan014.geometry}
            material={materials['dead_tube_coral_fan.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="deepslate_bricks007"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks007.geometry}
            material={materials['deepslate_bricks.003']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="deepslate_bricks008"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks008.geometry}
            material={materials['deepslate_bricks.003']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="deepslate_bricks009"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks009.geometry}
            material={materials['deepslate_bricks.003']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="deepslate_bricks020"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks020.geometry}
            material={materials['deepslate_bricks.003']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="deepslate_bricks021"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks021.geometry}
            material={materials['deepslate_bricks.003']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="deepslate_bricks022"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks022.geometry}
            material={materials['deepslate_bricks.003']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="deepslate_tiles008"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles008.geometry}
            material={materials['deepslate_tiles.003']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="deepslate_tiles009"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles009.geometry}
            material={materials['deepslate_tiles.003']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="deepslate_tiles020"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles020.geometry}
            material={materials['deepslate_tiles.003']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="deepslate_tiles021"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles021.geometry}
            material={materials['deepslate_tiles.003']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="deepslate_top004"
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Deepslate004"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate004.geometry}
              material={materials['deepslate_top.003']}
            />
            <mesh
              name="Deepslate004_1"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate004_1.geometry}
              material={materials['deepslate.003']}
            />
          </group>
          <group
            name="deepslate_top009"
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Deepslate009"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate009.geometry}
              material={materials['deepslate_top.003']}
            />
            <mesh
              name="Deepslate009_1"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate009_1.geometry}
              material={materials['deepslate.003']}
            />
          </group>
          <mesh
            name="diorite014"
            castShadow
            receiveShadow
            geometry={nodes.diorite014.geometry}
            material={materials['diorite.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="diorite015"
            castShadow
            receiveShadow
            geometry={nodes.diorite015.geometry}
            material={materials['diorite.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="diorite016"
            castShadow
            receiveShadow
            geometry={nodes.diorite016.geometry}
            material={materials['diorite.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="diorite017"
            castShadow
            receiveShadow
            geometry={nodes.diorite017.geometry}
            material={materials['diorite.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="diorite032"
            castShadow
            receiveShadow
            geometry={nodes.diorite032.geometry}
            material={materials['diorite.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="diorite033"
            castShadow
            receiveShadow
            geometry={nodes.diorite033.geometry}
            material={materials['diorite.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="diorite034"
            castShadow
            receiveShadow
            geometry={nodes.diorite034.geometry}
            material={materials['diorite.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="diorite035"
            castShadow
            receiveShadow
            geometry={nodes.diorite035.geometry}
            material={materials['diorite.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="dirt005"
            castShadow
            receiveShadow
            geometry={nodes.dirt005.geometry}
            material={materials['dirt.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="dirt006"
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Flower_Pot002"
              castShadow
              receiveShadow
              geometry={nodes.Flower_Pot002.geometry}
              material={materials['dirt.002']}
            />
            <mesh
              name="Flower_Pot002_1"
              castShadow
              receiveShadow
              geometry={nodes.Flower_Pot002_1.geometry}
              material={materials['flower_pot.002']}
            />
          </group>
          <mesh
            name="dirt012"
            castShadow
            receiveShadow
            geometry={nodes.dirt012.geometry}
            material={materials['dirt.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="dirt013"
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Flower_Pot005"
              castShadow
              receiveShadow
              geometry={nodes.Flower_Pot005.geometry}
              material={materials['dirt.002']}
            />
            <mesh
              name="Flower_Pot005_1"
              castShadow
              receiveShadow
              geometry={nodes.Flower_Pot005_1.geometry}
              material={materials['flower_pot.002']}
            />
          </group>
          <group
            name="dried_kelp_top003"
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Dried_Kelp_Block003"
              castShadow
              receiveShadow
              geometry={nodes.Dried_Kelp_Block003.geometry}
              material={materials['dried_kelp_top.002']}
            />
            <mesh
              name="Dried_Kelp_Block003_1"
              castShadow
              receiveShadow
              geometry={nodes.Dried_Kelp_Block003_1.geometry}
              material={materials['dried_kelp_side.002']}
            />
            <mesh
              name="Dried_Kelp_Block003_2"
              castShadow
              receiveShadow
              geometry={nodes.Dried_Kelp_Block003_2.geometry}
              material={materials['dried_kelp_bottom.002']}
            />
          </group>
          <group
            name="dried_kelp_top005"
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Dried_Kelp_Block006"
              castShadow
              receiveShadow
              geometry={nodes.Dried_Kelp_Block006.geometry}
              material={materials['dried_kelp_top.002']}
            />
            <mesh
              name="Dried_Kelp_Block006_1"
              castShadow
              receiveShadow
              geometry={nodes.Dried_Kelp_Block006_1.geometry}
              material={materials['dried_kelp_side.002']}
            />
            <mesh
              name="Dried_Kelp_Block006_2"
              castShadow
              receiveShadow
              geometry={nodes.Dried_Kelp_Block006_2.geometry}
              material={materials['dried_kelp_bottom.002']}
            />
          </group>
          <mesh
            name="glow_lichen003"
            castShadow
            receiveShadow
            geometry={nodes.glow_lichen003.geometry}
            material={materials['glow_lichen.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="glow_lichen007"
            castShadow
            receiveShadow
            geometry={nodes.glow_lichen007.geometry}
            material={materials['glow_lichen.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="granite005"
            castShadow
            receiveShadow
            geometry={nodes.granite005.geometry}
            material={materials['granite.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="granite014"
            castShadow
            receiveShadow
            geometry={nodes.granite014.geometry}
            material={materials['granite.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="gravel003"
            castShadow
            receiveShadow
            geometry={nodes.gravel003.geometry}
            material={materials['gravel.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="gravel007"
            castShadow
            receiveShadow
            geometry={nodes.gravel007.geometry}
            material={materials['gravel.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="gray_candle002"
            castShadow
            receiveShadow
            geometry={nodes.gray_candle002.geometry}
            material={materials['gray_candle.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="gray_candle005"
            castShadow
            receiveShadow
            geometry={nodes.gray_candle005.geometry}
            material={materials['gray_candle.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="gray_wool003"
            castShadow
            receiveShadow
            geometry={nodes.gray_wool003.geometry}
            material={materials['gray_wool.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="gray_wool009"
            castShadow
            receiveShadow
            geometry={nodes.gray_wool009.geometry}
            material={materials['gray_wool.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="hopper_inside002"
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Hopper002"
              castShadow
              receiveShadow
              geometry={nodes.Hopper002.geometry}
              material={materials['hopper_inside.001']}
            />
            <mesh
              name="Hopper002_1"
              castShadow
              receiveShadow
              geometry={nodes.Hopper002_1.geometry}
              material={materials['hopper_outside.001']}
            />
            <mesh
              name="Hopper002_2"
              castShadow
              receiveShadow
              geometry={nodes.Hopper002_2.geometry}
              material={materials['hopper_top.001']}
            />
          </group>
          <group
            name="hopper_inside005"
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Hopper005"
              castShadow
              receiveShadow
              geometry={nodes.Hopper005.geometry}
              material={materials['hopper_inside.001']}
            />
            <mesh
              name="Hopper005_1"
              castShadow
              receiveShadow
              geometry={nodes.Hopper005_1.geometry}
              material={materials['hopper_outside.001']}
            />
            <mesh
              name="Hopper005_2"
              castShadow
              receiveShadow
              geometry={nodes.Hopper005_2.geometry}
              material={materials['hopper_top.001']}
            />
          </group>
          <mesh
            name="ice003"
            castShadow
            receiveShadow
            geometry={nodes.ice003.geometry}
            material={materials['ice.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="ice006"
            castShadow
            receiveShadow
            geometry={nodes.ice006.geometry}
            material={materials['ice.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="iron_bars002"
            castShadow
            receiveShadow
            geometry={nodes.iron_bars002.geometry}
            material={materials['iron_bars.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="iron_bars006"
            castShadow
            receiveShadow
            geometry={nodes.iron_bars006.geometry}
            material={materials['iron_bars.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="iron_block006"
            castShadow
            receiveShadow
            geometry={nodes.iron_block006.geometry}
            material={materials['iron_block.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="iron_block011"
            castShadow
            receiveShadow
            geometry={nodes.iron_block011.geometry}
            material={materials['iron_block.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="iron_door_top003"
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Iron_Door003"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door003.geometry}
              material={materials['iron_door_top.002']}
            />
            <mesh
              name="Iron_Door003_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door003_1.geometry}
              material={materials['iron_door_bottom.002']}
            />
          </group>
          <group
            name="iron_door_top007"
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Iron_Door007"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door007.geometry}
              material={materials['iron_door_top.002']}
            />
            <mesh
              name="Iron_Door007_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door007_1.geometry}
              material={materials['iron_door_bottom.002']}
            />
          </group>
          <mesh
            name="iron_trapdoor003"
            castShadow
            receiveShadow
            geometry={nodes.iron_trapdoor003.geometry}
            material={materials['iron_trapdoor.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="iron_trapdoor008"
            castShadow
            receiveShadow
            geometry={nodes.iron_trapdoor008.geometry}
            material={materials['iron_trapdoor.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="lever003"
            castShadow
            receiveShadow
            geometry={nodes.lever003.geometry}
            material={materials['lever.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="lever007"
            castShadow
            receiveShadow
            geometry={nodes.lever007.geometry}
            material={materials['lever.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="light_gray_candle001"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_candle001.geometry}
            material={materials['light_gray_candle.001']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="light_gray_candle002"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_candle002.geometry}
            material={materials['light_gray_candle.001']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="light_gray_concrete_powder003"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_concrete_powder003.geometry}
            material={materials['light_gray_concrete_powder.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="light_gray_concrete_powder007"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_concrete_powder007.geometry}
            material={materials['light_gray_concrete_powder.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="loom_side002"
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Loom003"
              castShadow
              receiveShadow
              geometry={nodes.Loom003.geometry}
              material={materials['loom_side.002']}
            />
            <mesh
              name="Loom003_1"
              castShadow
              receiveShadow
              geometry={nodes.Loom003_1.geometry}
              material={materials['loom_bottom.002']}
            />
          </group>
          <group
            name="loom_side004"
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Loom005"
              castShadow
              receiveShadow
              geometry={nodes.Loom005.geometry}
              material={materials['loom_side.002']}
            />
            <mesh
              name="Loom005_1"
              castShadow
              receiveShadow
              geometry={nodes.Loom005_1.geometry}
              material={materials['loom_bottom.002']}
            />
          </group>
          <mesh
            name="mud_bricks007"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks007.geometry}
            material={materials['mud_bricks.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="mud_bricks013"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks013.geometry}
            material={materials['mud_bricks.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="mushroom_stem003"
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Red_Mushroom_Block003"
              castShadow
              receiveShadow
              geometry={nodes.Red_Mushroom_Block003.geometry}
              material={materials['mushroom_stem.002']}
            />
            <mesh
              name="Red_Mushroom_Block003_1"
              castShadow
              receiveShadow
              geometry={nodes.Red_Mushroom_Block003_1.geometry}
              material={materials['mushroom_block_inside.001']}
            />
          </group>
          <group
            name="mushroom_stem007"
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Red_Mushroom_Block007"
              castShadow
              receiveShadow
              geometry={nodes.Red_Mushroom_Block007.geometry}
              material={materials['mushroom_stem.002']}
            />
            <mesh
              name="Red_Mushroom_Block007_1"
              castShadow
              receiveShadow
              geometry={nodes.Red_Mushroom_Block007_1.geometry}
              material={materials['mushroom_block_inside.001']}
            />
          </group>
          <group
            name="oak_door_top003"
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Oak_Door003"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door003.geometry}
              material={materials['oak_door_top.002']}
            />
            <mesh
              name="Oak_Door003_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door003_1.geometry}
              material={materials['oak_door_bottom.002']}
            />
          </group>
          <group
            name="oak_door_top008"
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Oak_Door008"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door008.geometry}
              material={materials['oak_door_top.002']}
            />
            <mesh
              name="Oak_Door008_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door008_1.geometry}
              material={materials['oak_door_bottom.002']}
            />
          </group>
          <mesh
            name="oak_planks020"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks020.geometry}
            material={materials['oak_planks.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="oak_planks021"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks021.geometry}
            material={materials['oak_planks.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="oak_planks022"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks022.geometry}
            material={materials['oak_planks.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="oak_planks043"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks043.geometry}
            material={materials['oak_planks.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="oak_planks047"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks047.geometry}
            material={materials['oak_planks.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="oak_planks048"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks048.geometry}
            material={materials['oak_planks.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="oak_trapdoor003"
            castShadow
            receiveShadow
            geometry={nodes.oak_trapdoor003.geometry}
            material={materials['oak_trapdoor.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="oak_trapdoor007"
            castShadow
            receiveShadow
            geometry={nodes.oak_trapdoor007.geometry}
            material={materials['oak_trapdoor.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="piston_top003"
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Piston_Head003"
              castShadow
              receiveShadow
              geometry={nodes.Piston_Head003.geometry}
              material={materials['piston_top.002']}
            />
            <mesh
              name="Piston_Head003_1"
              castShadow
              receiveShadow
              geometry={nodes.Piston_Head003_1.geometry}
              material={materials['piston_side.002']}
            />
          </group>
          <group
            name="piston_top006"
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Piston_Head007"
              castShadow
              receiveShadow
              geometry={nodes.Piston_Head007.geometry}
              material={materials['piston_top.002']}
            />
            <mesh
              name="Piston_Head007_1"
              castShadow
              receiveShadow
              geometry={nodes.Piston_Head007_1.geometry}
              material={materials['piston_side.002']}
            />
          </group>
          <mesh
            name="polished_andesite009"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite009.geometry}
            material={materials['polished_andesite.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="polished_andesite010"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite010.geometry}
            material={materials['polished_andesite.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="polished_andesite011"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite011.geometry}
            material={materials['polished_andesite.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="polished_andesite023"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite023.geometry}
            material={materials['polished_andesite.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="polished_andesite024"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite024.geometry}
            material={materials['polished_andesite.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="polished_andesite025"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite025.geometry}
            material={materials['polished_andesite.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="polished_deepslate003"
            castShadow
            receiveShadow
            geometry={nodes.polished_deepslate003.geometry}
            material={materials['polished_deepslate.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="polished_deepslate012"
            castShadow
            receiveShadow
            geometry={nodes.polished_deepslate012.geometry}
            material={materials['polished_deepslate.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="polished_diorite004"
            castShadow
            receiveShadow
            geometry={nodes.polished_diorite004.geometry}
            material={materials['polished_diorite.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="polished_diorite005"
            castShadow
            receiveShadow
            geometry={nodes.polished_diorite005.geometry}
            material={materials['polished_diorite.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="polished_diorite010"
            castShadow
            receiveShadow
            geometry={nodes.polished_diorite010.geometry}
            material={materials['polished_diorite.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="polished_diorite011"
            castShadow
            receiveShadow
            geometry={nodes.polished_diorite011.geometry}
            material={materials['polished_diorite.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="pumpkin_stem004"
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Pumpkin_Stem_age_7004"
              castShadow
              receiveShadow
              geometry={nodes.Pumpkin_Stem_age_7004.geometry}
              material={materials['pumpkin_stem.002']}
            />
            <mesh
              name="Pumpkin_Stem_age_7004_1"
              castShadow
              receiveShadow
              geometry={nodes.Pumpkin_Stem_age_7004_1.geometry}
              material={materials['attached_pumpkin_stem.002']}
            />
          </group>
          <mesh
            name="pumpkin_stem005"
            castShadow
            receiveShadow
            geometry={nodes.pumpkin_stem005.geometry}
            material={materials['pumpkin_stem.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="pumpkin_stem009"
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Pumpkin_Stem_age_7012"
              castShadow
              receiveShadow
              geometry={nodes.Pumpkin_Stem_age_7012.geometry}
              material={materials['pumpkin_stem.002']}
            />
            <mesh
              name="Pumpkin_Stem_age_7012_1"
              castShadow
              receiveShadow
              geometry={nodes.Pumpkin_Stem_age_7012_1.geometry}
              material={materials['attached_pumpkin_stem.002']}
            />
          </group>
          <mesh
            name="pumpkin_stem010"
            castShadow
            receiveShadow
            geometry={nodes.pumpkin_stem010.geometry}
            material={materials['pumpkin_stem.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="pumpkin_top001"
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Skeleton_Wall_Skull001"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull001.geometry}
              material={materials['pumpkin_top.001']}
            />
            <mesh
              name="Skeleton_Wall_Skull001_1"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull001_1.geometry}
              material={materials['pumpkin_side.001']}
            />
            <mesh
              name="Skeleton_Wall_Skull001_2"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull001_2.geometry}
              material={materials['carved_pumpkin.001']}
            />
          </group>
          <group
            name="pumpkin_top005"
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Skeleton_Wall_Skull003"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull003.geometry}
              material={materials['pumpkin_top.001']}
            />
            <mesh
              name="Skeleton_Wall_Skull003_1"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull003_1.geometry}
              material={materials['pumpkin_side.001']}
            />
            <mesh
              name="Skeleton_Wall_Skull003_2"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull003_2.geometry}
              material={materials['carved_pumpkin.001']}
            />
          </group>
          <group
            name="quartz_block_bottom005"
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Quartz_Slab003"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab003.geometry}
              material={materials['quartz_block_bottom.002']}
            />
            <mesh
              name="Quartz_Slab003_1"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab003_1.geometry}
              material={materials['quartz_block_side.002']}
            />
            <mesh
              name="Quartz_Slab003_2"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab003_2.geometry}
              material={materials['quartz_block_top.002']}
            />
          </group>
          <group
            name="quartz_block_bottom014"
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Quartz_Slab007"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab007.geometry}
              material={materials['quartz_block_bottom.002']}
            />
            <mesh
              name="Quartz_Slab007_1"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab007_1.geometry}
              material={materials['quartz_block_side.002']}
            />
            <mesh
              name="Quartz_Slab007_2"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab007_2.geometry}
              material={materials['quartz_block_top.002']}
            />
          </group>
          <group
            name="quartz_block_side003"
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Block_of_Quartz003"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz003.geometry}
              material={materials['quartz_block_side.002']}
            />
            <mesh
              name="Block_of_Quartz003_1"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz003_1.geometry}
              material={materials['quartz_block_top.002']}
            />
            <mesh
              name="Block_of_Quartz003_2"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz003_2.geometry}
              material={materials['quartz_bricks.002']}
            />
          </group>
          <group
            name="quartz_block_side007"
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Block_of_Quartz007"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz007.geometry}
              material={materials['quartz_block_side.002']}
            />
            <mesh
              name="Block_of_Quartz007_1"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz007_1.geometry}
              material={materials['quartz_block_top.002']}
            />
            <mesh
              name="Block_of_Quartz007_2"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz007_2.geometry}
              material={materials['quartz_bricks.002']}
            />
          </group>
          <mesh
            name="quartz_block_top005"
            castShadow
            receiveShadow
            geometry={nodes.quartz_block_top005.geometry}
            material={materials['quartz_block_top.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="quartz_block_top012"
            castShadow
            receiveShadow
            geometry={nodes.quartz_block_top012.geometry}
            material={materials['quartz_block_top.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="rail002"
            castShadow
            receiveShadow
            geometry={nodes.rail002.geometry}
            material={materials['rail.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="rail006"
            castShadow
            receiveShadow
            geometry={nodes.rail006.geometry}
            material={materials['rail.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="redstone_torch_off002"
            castShadow
            receiveShadow
            geometry={nodes.redstone_torch_off002.geometry}
            material={materials['redstone_torch_off.001']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="redstone_torch_off006"
            castShadow
            receiveShadow
            geometry={nodes.redstone_torch_off006.geometry}
            material={materials['redstone_torch_off.001']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="repeater002"
            castShadow
            receiveShadow
            geometry={nodes.repeater002.geometry}
            material={materials['repeater.001']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="repeater006"
            castShadow
            receiveShadow
            geometry={nodes.repeater006.geometry}
            material={materials['repeater.001']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="rooted_dirt003"
            castShadow
            receiveShadow
            geometry={nodes.rooted_dirt003.geometry}
            material={materials['rooted_dirt.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="rooted_dirt007"
            castShadow
            receiveShadow
            geometry={nodes.rooted_dirt007.geometry}
            material={materials['rooted_dirt.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="sand003"
            castShadow
            receiveShadow
            geometry={nodes.sand003.geometry}
            material={materials['sand.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="sand007"
            castShadow
            receiveShadow
            geometry={nodes.sand007.geometry}
            material={materials['sand.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="sandstone002"
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Sandstone002"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone002.geometry}
              material={materials['sandstone.002']}
            />
            <mesh
              name="Sandstone002_1"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone002_1.geometry}
              material={materials['sandstone_bottom.002']}
            />
          </group>
          <group
            name="sandstone005"
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="Sandstone005"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone005.geometry}
              material={materials['sandstone.002']}
            />
            <mesh
              name="Sandstone005_1"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone005_1.geometry}
              material={materials['sandstone_bottom.002']}
            />
          </group>
          <mesh
            name="smooth_stone004"
            castShadow
            receiveShadow
            geometry={nodes.smooth_stone004.geometry}
            material={materials['smooth_stone.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="smooth_stone009"
            castShadow
            receiveShadow
            geometry={nodes.smooth_stone009.geometry}
            material={materials['smooth_stone.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="snow006"
            castShadow
            receiveShadow
            geometry={nodes.snow006.geometry}
            material={materials['snow.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="snow007"
            castShadow
            receiveShadow
            geometry={nodes.snow007.geometry}
            material={materials['snow.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="snow014"
            castShadow
            receiveShadow
            geometry={nodes.snow014.geometry}
            material={materials['snow.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="snow015"
            castShadow
            receiveShadow
            geometry={nodes.snow015.geometry}
            material={materials['snow.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="spruce_planks004"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks004.geometry}
            material={materials['spruce_planks.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="spruce_planks013"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks013.geometry}
            material={materials['spruce_planks.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone011"
            castShadow
            receiveShadow
            geometry={nodes.stone011.geometry}
            material={materials['stone.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone012"
            castShadow
            receiveShadow
            geometry={nodes.stone012.geometry}
            material={materials['stone.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone013"
            castShadow
            receiveShadow
            geometry={nodes.stone013.geometry}
            material={materials['stone.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone024"
            castShadow
            receiveShadow
            geometry={nodes.stone024.geometry}
            material={materials['stone.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone025"
            castShadow
            receiveShadow
            geometry={nodes.stone025.geometry}
            material={materials['stone.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone026"
            castShadow
            receiveShadow
            geometry={nodes.stone026.geometry}
            material={materials['stone.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone_bricks011"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks011.geometry}
            material={materials['stone_bricks.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone_bricks012"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks012.geometry}
            material={materials['stone_bricks.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone_bricks013"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks013.geometry}
            material={materials['stone_bricks.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone_bricks014"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks014.geometry}
            material={materials['stone_bricks.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone_bricks029"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks029.geometry}
            material={materials['stone_bricks.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone_bricks030"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks030.geometry}
            material={materials['stone_bricks.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone_bricks031"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks031.geometry}
            material={materials['stone_bricks.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stone_bricks032"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks032.geometry}
            material={materials['stone_bricks.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stripped_spruce_log003"
            castShadow
            receiveShadow
            geometry={nodes.stripped_spruce_log003.geometry}
            material={materials['stripped_spruce_log.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="stripped_spruce_log006"
            castShadow
            receiveShadow
            geometry={nodes.stripped_spruce_log006.geometry}
            material={materials['stripped_spruce_log.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="tripwire_hook003"
            castShadow
            receiveShadow
            geometry={nodes.tripwire_hook003.geometry}
            material={materials['tripwire_hook.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="tripwire_hook008"
            castShadow
            receiveShadow
            geometry={nodes.tripwire_hook008.geometry}
            material={materials['tripwire_hook.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="tuff003"
            castShadow
            receiveShadow
            geometry={nodes.tuff003.geometry}
            material={materials['tuff.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="tuff007"
            castShadow
            receiveShadow
            geometry={nodes.tuff007.geometry}
            material={materials['tuff.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="warped_fungus002"
            castShadow
            receiveShadow
            geometry={nodes.warped_fungus002.geometry}
            material={materials['warped_fungus.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="warped_fungus005"
            castShadow
            receiveShadow
            geometry={nodes.warped_fungus005.geometry}
            material={materials['warped_fungus.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="white_candle003"
            castShadow
            receiveShadow
            geometry={nodes.white_candle003.geometry}
            material={materials['white_candle.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="white_candle007"
            castShadow
            receiveShadow
            geometry={nodes.white_candle007.geometry}
            material={materials['white_candle.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="white_concrete_powder003"
            castShadow
            receiveShadow
            geometry={nodes.white_concrete_powder003.geometry}
            material={materials['white_concrete_powder.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="white_concrete_powder007"
            castShadow
            receiveShadow
            geometry={nodes.white_concrete_powder007.geometry}
            material={materials['white_concrete_powder.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="white_shulker_box002"
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="White_Shulker_Box003"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box003.geometry}
              material={materials['white_shulker_box.001']}
            />
            <mesh
              name="White_Shulker_Box003_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box003_1.geometry}
              material={materials['shulker_side_white.002']}
            />
            <mesh
              name="White_Shulker_Box003_2"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box003_2.geometry}
              material={materials['shulker_bottom_white.002']}
            />
          </group>
          <group
            name="white_shulker_box006"
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="White_Shulker_Box007"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box007.geometry}
              material={materials['white_shulker_box.001']}
            />
            <mesh
              name="White_Shulker_Box007_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box007_1.geometry}
              material={materials['shulker_side_white.002']}
            />
            <mesh
              name="White_Shulker_Box007_2"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box007_2.geometry}
              material={materials['shulker_bottom_white.002']}
            />
          </group>
          <group
            name="white_stained_glass003"
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="White_Stained_Glass_Pane003"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane003.geometry}
              material={materials['white_stained_glass.002']}
            />
            <mesh
              name="White_Stained_Glass_Pane003_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane003_1.geometry}
              material={materials['white_stained_glass_pane_top.002']}
            />
          </group>
          <group
            name="white_stained_glass008"
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <mesh
              name="White_Stained_Glass_Pane007"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane007.geometry}
              material={materials['white_stained_glass.002']}
            />
            <mesh
              name="White_Stained_Glass_Pane007_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane007_1.geometry}
              material={materials['white_stained_glass_pane_top.002']}
            />
          </group>
          <mesh
            name="white_wool006"
            castShadow
            receiveShadow
            geometry={nodes.white_wool006.geometry}
            material={materials['white_wool.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="white_wool007"
            castShadow
            receiveShadow
            geometry={nodes.white_wool007.geometry}
            material={materials['white_wool.002']}
            position={[161.604, -191, 178.725]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="white_wool012"
            castShadow
            receiveShadow
            geometry={nodes.white_wool012.geometry}
            material={materials['white_wool.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="white_wool013"
            castShadow
            receiveShadow
            geometry={nodes.white_wool013.geometry}
            material={materials['white_wool.002']}
            position={[161.604, -191, 528.495]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
        </group>
        <group name="(2)_mcprep_empty004" position={[0, 191, -0.5]}>
          <mesh
            name="acacia_log004"
            castShadow
            receiveShadow
            geometry={nodes.acacia_log004.geometry}
            material={materials['acacia_log.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="andesite018"
            castShadow
            receiveShadow
            geometry={nodes.andesite018.geometry}
            material={materials['andesite.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="andesite019"
            castShadow
            receiveShadow
            geometry={nodes.andesite019.geometry}
            material={materials['andesite.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="andesite020"
            castShadow
            receiveShadow
            geometry={nodes.andesite020.geometry}
            material={materials['andesite.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="andesite021"
            castShadow
            receiveShadow
            geometry={nodes.andesite021.geometry}
            material={materials['andesite.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="andesite022"
            castShadow
            receiveShadow
            geometry={nodes.andesite022.geometry}
            material={materials['andesite.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="bamboo_planks"
            castShadow
            receiveShadow
            geometry={nodes.bamboo_planks.geometry}
            material={materials.bamboo_planks}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="bedrock004"
            castShadow
            receiveShadow
            geometry={nodes.bedrock004.geometry}
            material={materials['bedrock.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="beehive_front"
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Beehive001"
              castShadow
              receiveShadow
              geometry={nodes.Beehive001.geometry}
              material={materials.beehive_front}
            />
            <mesh
              name="Beehive001_1"
              castShadow
              receiveShadow
              geometry={nodes.Beehive001_1.geometry}
              material={materials['beehive_side.001']}
            />
          </group>
          <mesh
            name="birch_planks011"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks011.geometry}
            material={materials['birch_planks.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="birch_planks012"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks012.geometry}
            material={materials['birch_planks.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="black_concrete001"
            castShadow
            receiveShadow
            geometry={nodes.black_concrete001.geometry}
            material={materials['black_concrete.001']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="black_concrete_powder001"
            castShadow
            receiveShadow
            geometry={nodes.black_concrete_powder001.geometry}
            material={materials['black_concrete_powder.001']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="black_wool004"
            castShadow
            receiveShadow
            geometry={nodes.black_wool004.geometry}
            material={materials['black_wool.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="blue_concrete001"
            castShadow
            receiveShadow
            geometry={nodes.blue_concrete001.geometry}
            material={materials['blue_concrete.001']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="blue_concrete_powder003"
            castShadow
            receiveShadow
            geometry={nodes.blue_concrete_powder003.geometry}
            material={materials['blue_concrete_powder.002']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="blue_ice003"
            castShadow
            receiveShadow
            geometry={nodes.blue_ice003.geometry}
            material={materials['blue_ice.002']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="bone_block_side004"
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Bone_Block004"
              castShadow
              receiveShadow
              geometry={nodes.Bone_Block004.geometry}
              material={materials['bone_block_side.003']}
            />
            <mesh
              name="Bone_Block004_1"
              castShadow
              receiveShadow
              geometry={nodes.Bone_Block004_1.geometry}
              material={materials['bone_block_top.003']}
            />
          </group>
          <group
            name="brewing_stand_base001"
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Brewing_Stand001"
              castShadow
              receiveShadow
              geometry={nodes.Brewing_Stand001.geometry}
              material={materials['brewing_stand_base.001']}
            />
            <mesh
              name="Brewing_Stand001_1"
              castShadow
              receiveShadow
              geometry={nodes.Brewing_Stand001_1.geometry}
              material={materials['brewing_stand.001']}
            />
          </group>
          <mesh
            name="brown_mushroom004"
            castShadow
            receiveShadow
            geometry={nodes.brown_mushroom004.geometry}
            material={materials['brown_mushroom.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="calcite004"
            castShadow
            receiveShadow
            geometry={nodes.calcite004.geometry}
            material={materials['calcite.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="chain004"
            castShadow
            receiveShadow
            geometry={nodes.chain004.geometry}
            material={materials['chain.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="cherry_planks007"
            castShadow
            receiveShadow
            geometry={nodes.cherry_planks007.geometry}
            material={materials['cherry_planks.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="cherry_planks008"
            castShadow
            receiveShadow
            geometry={nodes.cherry_planks008.geometry}
            material={materials['cherry_planks.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="cherry_planks009"
            castShadow
            receiveShadow
            geometry={nodes.cherry_planks009.geometry}
            material={materials['cherry_planks.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="cherry_trapdoor003"
            castShadow
            receiveShadow
            geometry={nodes.cherry_trapdoor003.geometry}
            material={materials['cherry_trapdoor.002']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="clay004"
            castShadow
            receiveShadow
            geometry={nodes.clay004.geometry}
            material={materials['clay.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="cobbled_deepslate013"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate013.geometry}
            material={materials['cobbled_deepslate.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="cobbled_deepslate014"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate014.geometry}
            material={materials['cobbled_deepslate.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="cobblestone015"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone015.geometry}
            material={materials['cobblestone.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="cobblestone016"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone016.geometry}
            material={materials['cobblestone.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="cobblestone017"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone017.geometry}
            material={materials['cobblestone.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="cyan_concrete"
            castShadow
            receiveShadow
            geometry={nodes.cyan_concrete.geometry}
            material={materials.cyan_concrete}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="cyan_concrete_powder"
            castShadow
            receiveShadow
            geometry={nodes.cyan_concrete_powder.geometry}
            material={materials.cyan_concrete_powder}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="dark_oak_log004"
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Grindstone004"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone004.geometry}
              material={materials['dark_oak_log.003']}
            />
            <mesh
              name="Grindstone004_1"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone004_1.geometry}
              material={materials['grindstone_side.003']}
            />
            <mesh
              name="Grindstone004_2"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone004_2.geometry}
              material={materials['grindstone_pivot.003']}
            />
            <mesh
              name="Grindstone004_3"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone004_3.geometry}
              material={materials['grindstone_round.003']}
            />
          </group>
          <mesh
            name="dark_prismarine"
            castShadow
            receiveShadow
            geometry={nodes.dark_prismarine.geometry}
            material={materials.dark_prismarine}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="dead_brain_coral"
            castShadow
            receiveShadow
            geometry={nodes.dead_brain_coral.geometry}
            material={materials.dead_brain_coral}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="dead_brain_coral_block004"
            castShadow
            receiveShadow
            geometry={nodes.dead_brain_coral_block004.geometry}
            material={materials['dead_brain_coral_block.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="dead_brain_coral_fan003"
            castShadow
            receiveShadow
            geometry={nodes.dead_brain_coral_fan003.geometry}
            material={materials['dead_brain_coral_fan.002']}
            position={[-6.959, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="dead_bubble_coral_fan003"
            castShadow
            receiveShadow
            geometry={nodes.dead_bubble_coral_fan003.geometry}
            material={materials['dead_bubble_coral_fan.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="dead_horn_coral003"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral003.geometry}
            material={materials['dead_horn_coral.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="dead_horn_coral_fan008"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral_fan008.geometry}
            material={materials['dead_horn_coral_fan.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="dead_horn_coral_fan009"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral_fan009.geometry}
            material={materials['dead_horn_coral_fan.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="dead_tube_coral002"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral002.geometry}
            material={materials['dead_tube_coral.001']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="dead_tube_coral_fan007"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral_fan007.geometry}
            material={materials['dead_tube_coral_fan.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="dead_tube_coral_fan008"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral_fan008.geometry}
            material={materials['dead_tube_coral_fan.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="deepslate_bricks010"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks010.geometry}
            material={materials['deepslate_bricks.004']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="deepslate_bricks011"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks011.geometry}
            material={materials['deepslate_bricks.004']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="deepslate_tiles010"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles010.geometry}
            material={materials['deepslate_tiles.004']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="deepslate_top005"
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Deepslate005"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate005.geometry}
              material={materials['deepslate_top.004']}
            />
            <mesh
              name="Deepslate005_1"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate005_1.geometry}
              material={materials['deepslate.004']}
            />
          </group>
          <mesh
            name="diorite018"
            castShadow
            receiveShadow
            geometry={nodes.diorite018.geometry}
            material={materials['diorite.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="diorite019"
            castShadow
            receiveShadow
            geometry={nodes.diorite019.geometry}
            material={materials['diorite.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="diorite020"
            castShadow
            receiveShadow
            geometry={nodes.diorite020.geometry}
            material={materials['diorite.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="diorite021"
            castShadow
            receiveShadow
            geometry={nodes.diorite021.geometry}
            material={materials['diorite.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="diorite022"
            castShadow
            receiveShadow
            geometry={nodes.diorite022.geometry}
            material={materials['diorite.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="dirt007"
            castShadow
            receiveShadow
            geometry={nodes.dirt007.geometry}
            material={materials['dirt.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="dirt008"
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Flower_Pot003"
              castShadow
              receiveShadow
              geometry={nodes.Flower_Pot003.geometry}
              material={materials['dirt.003']}
            />
            <mesh
              name="Flower_Pot003_1"
              castShadow
              receiveShadow
              geometry={nodes.Flower_Pot003_1.geometry}
              material={materials['flower_pot.003']}
            />
          </group>
          <mesh
            name="end_rod001"
            castShadow
            receiveShadow
            geometry={nodes.end_rod001.geometry}
            material={materials['end_rod.001']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="glow_lichen004"
            castShadow
            receiveShadow
            geometry={nodes.glow_lichen004.geometry}
            material={materials['glow_lichen.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="granite006"
            castShadow
            receiveShadow
            geometry={nodes.granite006.geometry}
            material={materials['granite.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="granite007"
            castShadow
            receiveShadow
            geometry={nodes.granite007.geometry}
            material={materials['granite.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="gravel004"
            castShadow
            receiveShadow
            geometry={nodes.gravel004.geometry}
            material={materials['gravel.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="gray_wool004"
            castShadow
            receiveShadow
            geometry={nodes.gray_wool004.geometry}
            material={materials['gray_wool.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="hay_block_side003"
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Hay_Bale003"
              castShadow
              receiveShadow
              geometry={nodes.Hay_Bale003.geometry}
              material={materials['hay_block_side.002']}
            />
            <mesh
              name="Hay_Bale003_1"
              castShadow
              receiveShadow
              geometry={nodes.Hay_Bale003_1.geometry}
              material={materials['hay_block_top.002']}
            />
          </group>
          <mesh
            name="ice004"
            castShadow
            receiveShadow
            geometry={nodes.ice004.geometry}
            material={materials['ice.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="iron_bars003"
            castShadow
            receiveShadow
            geometry={nodes.iron_bars003.geometry}
            material={materials['iron_bars.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="iron_block007"
            castShadow
            receiveShadow
            geometry={nodes.iron_block007.geometry}
            material={materials['iron_block.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="iron_block008"
            castShadow
            receiveShadow
            geometry={nodes.iron_block008.geometry}
            material={materials['iron_block.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="iron_door_top004"
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Iron_Door004"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door004.geometry}
              material={materials['iron_door_top.003']}
            />
            <mesh
              name="Iron_Door004_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door004_1.geometry}
              material={materials['iron_door_bottom.003']}
            />
          </group>
          <mesh
            name="iron_trapdoor004"
            castShadow
            receiveShadow
            geometry={nodes.iron_trapdoor004.geometry}
            material={materials['iron_trapdoor.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="lever004"
            castShadow
            receiveShadow
            geometry={nodes.lever004.geometry}
            material={materials['lever.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="light_gray_concrete"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_concrete.geometry}
            material={materials.light_gray_concrete}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="light_gray_concrete_powder004"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_concrete_powder004.geometry}
            material={materials['light_gray_concrete_powder.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="light_gray_stained_glass"
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Light_Stained_Glass_Pane"
              castShadow
              receiveShadow
              geometry={nodes.Light_Stained_Glass_Pane.geometry}
              material={materials.light_gray_stained_glass}
            />
            <mesh
              name="Light_Stained_Glass_Pane_1"
              castShadow
              receiveShadow
              geometry={nodes.Light_Stained_Glass_Pane_1.geometry}
              material={materials.light_gray_stained_glass_pane_top}
            />
          </group>
          <group
            name="light_gray_wool001"
            position={[42.117, -191, 11.066]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="lily_of_the_valley"
            castShadow
            receiveShadow
            geometry={nodes.lily_of_the_valley.geometry}
            material={materials.lily_of_the_valley}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="mangrove_planks003"
            castShadow
            receiveShadow
            geometry={nodes.mangrove_planks003.geometry}
            material={materials['mangrove_planks.001']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="mangrove_planks004"
            castShadow
            receiveShadow
            geometry={nodes.mangrove_planks004.geometry}
            material={materials['mangrove_planks.001']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="mossy_cobblestone002"
            castShadow
            receiveShadow
            geometry={nodes.mossy_cobblestone002.geometry}
            material={materials['mossy_cobblestone.001']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="mossy_cobblestone003"
            castShadow
            receiveShadow
            geometry={nodes.mossy_cobblestone003.geometry}
            material={materials['mossy_cobblestone.001']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="mud_bricks008"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks008.geometry}
            material={materials['mud_bricks.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="mushroom_stem004"
            castShadow
            receiveShadow
            geometry={nodes.mushroom_stem004.geometry}
            material={materials['mushroom_stem.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="nether_sprouts"
            castShadow
            receiveShadow
            geometry={nodes.nether_sprouts.geometry}
            material={materials.nether_sprouts}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="oak_door_top004"
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Oak_Door004"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door004.geometry}
              material={materials['oak_door_top.003']}
            />
            <mesh
              name="Oak_Door004_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door004_1.geometry}
              material={materials['oak_door_bottom.003']}
            />
          </group>
          <mesh
            name="oak_planks023"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks023.geometry}
            material={materials['oak_planks.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="oak_planks024"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks024.geometry}
            material={materials['oak_planks.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="oak_planks025"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks025.geometry}
            material={materials['oak_planks.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="oak_planks026"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks026.geometry}
            material={materials['oak_planks.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="oak_trapdoor004"
            castShadow
            receiveShadow
            geometry={nodes.oak_trapdoor004.geometry}
            material={materials['oak_trapdoor.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="pink_wool001"
            castShadow
            receiveShadow
            geometry={nodes.pink_wool001.geometry}
            material={materials['pink_wool.001']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="piston_top004"
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Piston_Head004"
              castShadow
              receiveShadow
              geometry={nodes.Piston_Head004.geometry}
              material={materials['piston_top.003']}
            />
            <mesh
              name="Piston_Head004_1"
              castShadow
              receiveShadow
              geometry={nodes.Piston_Head004_1.geometry}
              material={materials['piston_side.003']}
            />
          </group>
          <mesh
            name="polished_andesite012"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite012.geometry}
            material={materials['polished_andesite.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="polished_andesite013"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite013.geometry}
            material={materials['polished_andesite.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="polished_andesite014"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite014.geometry}
            material={materials['polished_andesite.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="polished_deepslate004"
            castShadow
            receiveShadow
            geometry={nodes.polished_deepslate004.geometry}
            material={materials['polished_deepslate.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="prismarine_bricks"
            castShadow
            receiveShadow
            geometry={nodes.prismarine_bricks.geometry}
            material={materials.prismarine_bricks}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="pumpkin_stem006"
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Pumpkin_Stem_age_7006"
              castShadow
              receiveShadow
              geometry={nodes.Pumpkin_Stem_age_7006.geometry}
              material={materials['pumpkin_stem.003']}
            />
            <mesh
              name="Pumpkin_Stem_age_7006_1"
              castShadow
              receiveShadow
              geometry={nodes.Pumpkin_Stem_age_7006_1.geometry}
              material={materials['attached_pumpkin_stem.003']}
            />
          </group>
          <group
            name="pumpkin_top002"
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Skeleton_Skull"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Skull.geometry}
              material={materials['pumpkin_top.002']}
            />
            <mesh
              name="Skeleton_Skull_1"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Skull_1.geometry}
              material={materials['pumpkin_side.002']}
            />
            <mesh
              name="Skeleton_Skull_2"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Skull_2.geometry}
              material={materials['carved_pumpkin.002']}
            />
          </group>
          <group
            name="quartz_block_bottom006"
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Quartz_Slab004"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab004.geometry}
              material={materials['quartz_block_bottom.003']}
            />
            <mesh
              name="Quartz_Slab004_1"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab004_1.geometry}
              material={materials['quartz_block_side.003']}
            />
            <mesh
              name="Quartz_Slab004_2"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab004_2.geometry}
              material={materials['quartz_block_top.003']}
            />
          </group>
          <mesh
            name="quartz_block_bottom007"
            castShadow
            receiveShadow
            geometry={nodes.quartz_block_bottom007.geometry}
            material={materials['quartz_block_bottom.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="quartz_block_side004"
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Block_of_Quartz004"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz004.geometry}
              material={materials['quartz_block_side.003']}
            />
            <mesh
              name="Block_of_Quartz004_1"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz004_1.geometry}
              material={materials['quartz_block_top.003']}
            />
            <mesh
              name="Block_of_Quartz004_2"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz004_2.geometry}
              material={materials['quartz_bricks.003']}
            />
          </group>
          <mesh
            name="quartz_block_top006"
            castShadow
            receiveShadow
            geometry={nodes.quartz_block_top006.geometry}
            material={materials['quartz_block_top.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="quartz_block_top007"
            castShadow
            receiveShadow
            geometry={nodes.quartz_block_top007.geometry}
            material={materials['quartz_block_top.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="rail003"
            castShadow
            receiveShadow
            geometry={nodes.rail003.geometry}
            material={materials['rail.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="red_concrete"
            castShadow
            receiveShadow
            geometry={nodes.red_concrete.geometry}
            material={materials.red_concrete}
            position={[21.046, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="red_concrete_powder"
            castShadow
            receiveShadow
            geometry={nodes.red_concrete_powder.geometry}
            material={materials.red_concrete_powder}
            position={[21.046, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="red_sandstone"
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="Red_Sandstone_Slab"
              castShadow
              receiveShadow
              geometry={nodes.Red_Sandstone_Slab.geometry}
              material={materials.red_sandstone}
            />
            <mesh
              name="Red_Sandstone_Slab_1"
              castShadow
              receiveShadow
              geometry={nodes.Red_Sandstone_Slab_1.geometry}
              material={materials.red_sandstone_top}
            />
          </group>
          <mesh
            name="red_terracotta001"
            castShadow
            receiveShadow
            geometry={nodes.red_terracotta001.geometry}
            material={materials['red_terracotta.001']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="redstone_torch_off003"
            castShadow
            receiveShadow
            geometry={nodes.redstone_torch_off003.geometry}
            material={materials['redstone_torch_off.002']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="repeater003"
            castShadow
            receiveShadow
            geometry={nodes.repeater003.geometry}
            material={materials['repeater.002']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="rooted_dirt004"
            castShadow
            receiveShadow
            geometry={nodes.rooted_dirt004.geometry}
            material={materials['rooted_dirt.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="sand004"
            castShadow
            receiveShadow
            geometry={nodes.sand004.geometry}
            material={materials['sand.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="smooth_stone005"
            castShadow
            receiveShadow
            geometry={nodes.smooth_stone005.geometry}
            material={materials['smooth_stone.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="snow008"
            castShadow
            receiveShadow
            geometry={nodes.snow008.geometry}
            material={materials['snow.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="snow009"
            castShadow
            receiveShadow
            geometry={nodes.snow009.geometry}
            material={materials['snow.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="stone014"
            castShadow
            receiveShadow
            geometry={nodes.stone014.geometry}
            material={materials['stone.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="stone015"
            castShadow
            receiveShadow
            geometry={nodes.stone015.geometry}
            material={materials['stone.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="stone_bricks015"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks015.geometry}
            material={materials['stone_bricks.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="stone_bricks016"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks016.geometry}
            material={materials['stone_bricks.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="stone_bricks017"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks017.geometry}
            material={materials['stone_bricks.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="stone_bricks018"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks018.geometry}
            material={materials['stone_bricks.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="stone_bricks019"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks019.geometry}
            material={materials['stone_bricks.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="stripped_oak_log001"
            castShadow
            receiveShadow
            geometry={nodes.stripped_oak_log001.geometry}
            material={materials['stripped_oak_log.001']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="stripped_warped_stem003"
            castShadow
            receiveShadow
            geometry={nodes.stripped_warped_stem003.geometry}
            material={materials['stripped_warped_stem.002']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="tnt_side"
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="TNT"
              castShadow
              receiveShadow
              geometry={nodes.TNT.geometry}
              material={materials.tnt_side}
            />
            <mesh
              name="TNT_1"
              castShadow
              receiveShadow
              geometry={nodes.TNT_1.geometry}
              material={materials.tnt_top}
            />
            <mesh
              name="TNT_2"
              castShadow
              receiveShadow
              geometry={nodes.TNT_2.geometry}
              material={materials.tnt_bottom}
            />
          </group>
          <mesh
            name="torchflower"
            castShadow
            receiveShadow
            geometry={nodes.torchflower.geometry}
            material={materials.torchflower}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="tripwire_hook004"
            castShadow
            receiveShadow
            geometry={nodes.tripwire_hook004.geometry}
            material={materials['tripwire_hook.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="tuff004"
            castShadow
            receiveShadow
            geometry={nodes.tuff004.geometry}
            material={materials['tuff.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="warped_fungus003"
            castShadow
            receiveShadow
            geometry={nodes.warped_fungus003.geometry}
            material={materials['warped_fungus.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="warped_planks"
            castShadow
            receiveShadow
            geometry={nodes.warped_planks.geometry}
            material={materials.warped_planks}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="warped_planks001"
            castShadow
            receiveShadow
            geometry={nodes.warped_planks001.geometry}
            material={materials.warped_planks}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="warped_planks002"
            castShadow
            receiveShadow
            geometry={nodes.warped_planks002.geometry}
            material={materials.warped_planks}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="warped_stem"
            castShadow
            receiveShadow
            geometry={nodes.warped_stem.geometry}
            material={materials.warped_stem}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="weathered_cut_copper"
            castShadow
            receiveShadow
            geometry={nodes.weathered_cut_copper.geometry}
            material={materials.weathered_cut_copper}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="white_candle004"
            castShadow
            receiveShadow
            geometry={nodes.white_candle004.geometry}
            material={materials['white_candle.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="white_concrete_powder004"
            castShadow
            receiveShadow
            geometry={nodes.white_concrete_powder004.geometry}
            material={materials['white_concrete_powder.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <group
            name="white_shulker_box003"
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="White_Shulker_Box004"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box004.geometry}
              material={materials['white_shulker_box.002']}
            />
            <mesh
              name="White_Shulker_Box004_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box004_1.geometry}
              material={materials['shulker_side_white.003']}
            />
            <mesh
              name="White_Shulker_Box004_2"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box004_2.geometry}
              material={materials['shulker_bottom_white.003']}
            />
          </group>
          <group
            name="white_stained_glass004"
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh
              name="White_Stained_Glass_Pane004"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane004.geometry}
              material={materials['white_stained_glass.003']}
            />
            <mesh
              name="White_Stained_Glass_Pane004_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane004_1.geometry}
              material={materials['white_stained_glass_pane_top.003']}
            />
          </group>
          <mesh
            name="white_wool008"
            castShadow
            receiveShadow
            geometry={nodes.white_wool008.geometry}
            material={materials['white_wool.003']}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
          <mesh
            name="yellow_concrete"
            castShadow
            receiveShadow
            geometry={nodes.yellow_concrete.geometry}
            material={materials.yellow_concrete}
            position={[2.566, -191, 250.053]}
            rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          />
        </group>
        <group name="(2)_mcprep_empty005" position={[-0.5, 191, 0]}>
          <mesh
            name="acacia_log005"
            castShadow
            receiveShadow
            geometry={nodes.acacia_log005.geometry}
            material={materials['acacia_log.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="andesite023"
            castShadow
            receiveShadow
            geometry={nodes.andesite023.geometry}
            material={materials['andesite.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="andesite024"
            castShadow
            receiveShadow
            geometry={nodes.andesite024.geometry}
            material={materials['andesite.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="andesite025"
            castShadow
            receiveShadow
            geometry={nodes.andesite025.geometry}
            material={materials['andesite.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="andesite026"
            castShadow
            receiveShadow
            geometry={nodes.andesite026.geometry}
            material={materials['andesite.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="andesite027"
            castShadow
            receiveShadow
            geometry={nodes.andesite027.geometry}
            material={materials['andesite.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <group
            name="azalea_top"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Azalea"
              castShadow
              receiveShadow
              geometry={nodes.Azalea.geometry}
              material={materials.azalea_top}
            />
            <mesh
              name="Azalea_1"
              castShadow
              receiveShadow
              geometry={nodes.Azalea_1.geometry}
              material={materials.azalea_side}
            />
            <mesh
              name="Azalea_2"
              castShadow
              receiveShadow
              geometry={nodes.Azalea_2.geometry}
              material={materials.azalea_plant}
            />
          </group>
          <mesh
            name="bamboo_planks001"
            castShadow
            receiveShadow
            geometry={nodes.bamboo_planks001.geometry}
            material={materials['bamboo_planks.001']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="basalt_side"
            castShadow
            receiveShadow
            geometry={nodes.basalt_side.geometry}
            material={materials.basalt_side}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="bedrock005"
            castShadow
            receiveShadow
            geometry={nodes.bedrock005.geometry}
            material={materials['bedrock.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <group
            name="beehive_end001"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Beehive002"
              castShadow
              receiveShadow
              geometry={nodes.Beehive002.geometry}
              material={materials['beehive_end.001']}
            />
            <mesh
              name="Beehive002_1"
              castShadow
              receiveShadow
              geometry={nodes.Beehive002_1.geometry}
              material={materials['beehive_side.002']}
            />
          </group>
          <mesh
            name="birch_planks013"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks013.geometry}
            material={materials['birch_planks.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="birch_planks014"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks014.geometry}
            material={materials['birch_planks.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="birch_planks015"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks015.geometry}
            material={materials['birch_planks.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="birch_planks016"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks016.geometry}
            material={materials['birch_planks.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="birch_planks017"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks017.geometry}
            material={materials['birch_planks.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="birch_planks018"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks018.geometry}
            material={materials['birch_planks.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="birch_trapdoor001"
            castShadow
            receiveShadow
            geometry={nodes.birch_trapdoor001.geometry}
            material={materials['birch_trapdoor.001']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="black_candle"
            castShadow
            receiveShadow
            geometry={nodes.black_candle.geometry}
            material={materials.black_candle}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="black_concrete002"
            castShadow
            receiveShadow
            geometry={nodes.black_concrete002.geometry}
            material={materials['black_concrete.002']}
            position={[-76.908, -191, 343.437]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="black_concrete_powder002"
            castShadow
            receiveShadow
            geometry={nodes.black_concrete_powder002.geometry}
            material={materials['black_concrete_powder.002']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <group
            name="blackstone_top"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Blackstone004"
              castShadow
              receiveShadow
              geometry={nodes.Blackstone004.geometry}
              material={materials.blackstone_top}
            />
            <mesh
              name="Blackstone004_1"
              castShadow
              receiveShadow
              geometry={nodes.Blackstone004_1.geometry}
              material={materials['blackstone.003']}
            />
          </group>
          <mesh
            name="blue_ice004"
            castShadow
            receiveShadow
            geometry={nodes.blue_ice004.geometry}
            material={materials['blue_ice.003']}
            position={[-144.295, -174.955, 167.363]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="bone_block_side005"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Bone_Block005"
              castShadow
              receiveShadow
              geometry={nodes.Bone_Block005.geometry}
              material={materials['bone_block_side.004']}
            />
            <mesh
              name="Bone_Block005_1"
              castShadow
              receiveShadow
              geometry={nodes.Bone_Block005_1.geometry}
              material={materials['bone_block_top.004']}
            />
          </group>
          <group
            name="brewing_stand_base002"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Brewing_Stand002"
              castShadow
              receiveShadow
              geometry={nodes.Brewing_Stand002.geometry}
              material={materials['brewing_stand_base.002']}
            />
            <mesh
              name="Brewing_Stand002_1"
              castShadow
              receiveShadow
              geometry={nodes.Brewing_Stand002_1.geometry}
              material={materials['brewing_stand.002']}
            />
          </group>
          <mesh
            name="bricks002"
            castShadow
            receiveShadow
            geometry={nodes.bricks002.geometry}
            material={materials['bricks.001']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="brown_mushroom005"
            castShadow
            receiveShadow
            geometry={nodes.brown_mushroom005.geometry}
            material={materials['brown_mushroom.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="calcite005"
            castShadow
            receiveShadow
            geometry={nodes.calcite005.geometry}
            material={materials['calcite.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="chain005"
            castShadow
            receiveShadow
            geometry={nodes.chain005.geometry}
            material={materials['chain.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="clay005"
            castShadow
            receiveShadow
            geometry={nodes.clay005.geometry}
            material={materials['clay.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="cobbled_deepslate015"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate015.geometry}
            material={materials['cobbled_deepslate.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="cobbled_deepslate016"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate016.geometry}
            material={materials['cobbled_deepslate.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="cobbled_deepslate017"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate017.geometry}
            material={materials['cobbled_deepslate.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="cobblestone018"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone018.geometry}
            material={materials['cobblestone.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="cobblestone019"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone019.geometry}
            material={materials['cobblestone.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <group
            name="cyan_concrete_powder001"
            position={[103.369, -191, 130.272]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="cyan_wool"
            position={[103.369, -191, 130.272]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <group
            name="dark_oak_log005"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Grindstone005"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone005.geometry}
              material={materials['dark_oak_log.004']}
            />
            <mesh
              name="Grindstone005_1"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone005_1.geometry}
              material={materials['grindstone_side.004']}
            />
            <mesh
              name="Grindstone005_2"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone005_2.geometry}
              material={materials['grindstone_pivot.004']}
            />
            <mesh
              name="Grindstone005_3"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone005_3.geometry}
              material={materials['grindstone_round.004']}
            />
          </group>
          <mesh
            name="dark_oak_planks005"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks005.geometry}
            material={materials['dark_oak_planks.003']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="dark_oak_planks006"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks006.geometry}
            material={materials['dark_oak_planks.003']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="dead_brain_coral_block005"
            castShadow
            receiveShadow
            geometry={nodes.dead_brain_coral_block005.geometry}
            material={materials['dead_brain_coral_block.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="dead_brain_coral_fan004"
            castShadow
            receiveShadow
            geometry={nodes.dead_brain_coral_fan004.geometry}
            material={materials['dead_brain_coral_fan.003']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="dead_bubble_coral"
            castShadow
            receiveShadow
            geometry={nodes.dead_bubble_coral.geometry}
            material={materials.dead_bubble_coral}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="dead_bubble_coral_fan004"
            castShadow
            receiveShadow
            geometry={nodes.dead_bubble_coral_fan004.geometry}
            material={materials['dead_bubble_coral_fan.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="dead_fire_coral002"
            castShadow
            receiveShadow
            geometry={nodes.dead_fire_coral002.geometry}
            material={materials['dead_fire_coral.002']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="dead_fire_coral_fan"
            castShadow
            receiveShadow
            geometry={nodes.dead_fire_coral_fan.geometry}
            material={materials.dead_fire_coral_fan}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="dead_horn_coral004"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral004.geometry}
            material={materials['dead_horn_coral.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="dead_horn_coral_fan010"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral_fan010.geometry}
            material={materials['dead_horn_coral_fan.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="dead_horn_coral_fan011"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral_fan011.geometry}
            material={materials['dead_horn_coral_fan.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="dead_tube_coral_fan009"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral_fan009.geometry}
            material={materials['dead_tube_coral_fan.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="dead_tube_coral_fan010"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral_fan010.geometry}
            material={materials['dead_tube_coral_fan.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="deepslate_bricks012"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks012.geometry}
            material={materials['deepslate_bricks.005']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="deepslate_bricks013"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks013.geometry}
            material={materials['deepslate_bricks.005']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="deepslate_coal_ore001"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_coal_ore001.geometry}
            material={materials['deepslate_coal_ore.001']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="deepslate_tiles011"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles011.geometry}
            material={materials['deepslate_tiles.005']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="deepslate_tiles012"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles012.geometry}
            material={materials['deepslate_tiles.005']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <group
            name="deepslate_top006"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Deepslate006"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate006.geometry}
              material={materials['deepslate_top.005']}
            />
            <mesh
              name="Deepslate006_1"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate006_1.geometry}
              material={materials['deepslate.005']}
            />
          </group>
          <mesh
            name="diorite023"
            castShadow
            receiveShadow
            geometry={nodes.diorite023.geometry}
            material={materials['diorite.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="diorite024"
            castShadow
            receiveShadow
            geometry={nodes.diorite024.geometry}
            material={materials['diorite.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="diorite025"
            castShadow
            receiveShadow
            geometry={nodes.diorite025.geometry}
            material={materials['diorite.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="diorite026"
            castShadow
            receiveShadow
            geometry={nodes.diorite026.geometry}
            material={materials['diorite.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="dirt009"
            castShadow
            receiveShadow
            geometry={nodes.dirt009.geometry}
            material={materials['dirt.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <group
            name="dirt010"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Flower_Pot004"
              castShadow
              receiveShadow
              geometry={nodes.Flower_Pot004.geometry}
              material={materials['dirt.004']}
            />
            <mesh
              name="Flower_Pot004_1"
              castShadow
              receiveShadow
              geometry={nodes.Flower_Pot004_1.geometry}
              material={materials['flower_pot.004']}
            />
          </group>
          <mesh
            name="fern001"
            castShadow
            receiveShadow
            geometry={nodes.fern001.geometry}
            material={materials['fern.001']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="glow_lichen005"
            castShadow
            receiveShadow
            geometry={nodes.glow_lichen005.geometry}
            material={materials['glow_lichen.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="granite008"
            castShadow
            receiveShadow
            geometry={nodes.granite008.geometry}
            material={materials['granite.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="gravel005"
            castShadow
            receiveShadow
            geometry={nodes.gravel005.geometry}
            material={materials['gravel.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="gray_candle003"
            castShadow
            receiveShadow
            geometry={nodes.gray_candle003.geometry}
            material={materials['gray_candle.003']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="gray_concrete001"
            castShadow
            receiveShadow
            geometry={nodes.gray_concrete001.geometry}
            material={materials['gray_concrete.001']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="gray_concrete_powder003"
            castShadow
            receiveShadow
            geometry={nodes.gray_concrete_powder003.geometry}
            material={materials['gray_concrete_powder.002']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="gray_wool005"
            castShadow
            receiveShadow
            geometry={nodes.gray_wool005.geometry}
            material={materials['gray_wool.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="gray_wool006"
            castShadow
            receiveShadow
            geometry={nodes.gray_wool006.geometry}
            material={materials['gray_wool.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <group
            name="hay_block_side004"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Hay_Bale004"
              castShadow
              receiveShadow
              geometry={nodes.Hay_Bale004.geometry}
              material={materials['hay_block_side.003']}
            />
            <mesh
              name="Hay_Bale004_1"
              castShadow
              receiveShadow
              geometry={nodes.Hay_Bale004_1.geometry}
              material={materials['hay_block_top.003']}
            />
          </group>
          <group
            name="hopper_inside003"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Hopper003"
              castShadow
              receiveShadow
              geometry={nodes.Hopper003.geometry}
              material={materials['hopper_inside.002']}
            />
            <mesh
              name="Hopper003_1"
              castShadow
              receiveShadow
              geometry={nodes.Hopper003_1.geometry}
              material={materials['hopper_outside.002']}
            />
          </group>
          <mesh
            name="ice005"
            castShadow
            receiveShadow
            geometry={nodes.ice005.geometry}
            material={materials['ice.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="iron_bars004"
            castShadow
            receiveShadow
            geometry={nodes.iron_bars004.geometry}
            material={materials['iron_bars.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="iron_block009"
            castShadow
            receiveShadow
            geometry={nodes.iron_block009.geometry}
            material={materials['iron_block.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <group
            name="iron_door_top005"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door005"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door005.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door005_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door005_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top013"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door014"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door014.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door014_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door014_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top014"
            position={[81.333, -190.091, 599.767]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door015"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door015.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door015_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door015_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top015"
            position={[81.333, -190.091, 613.767]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door016"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door016.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door016_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door016_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top016"
            position={[81.333, -190.091, 571.233]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door017"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door017.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door017_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door017_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top017"
            position={[81.333, -190.091, 585.233]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door018"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door018.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door018_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door018_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top018"
            position={[81.333, -190.091, 542.767]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door019"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door019.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door019_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door019_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top019"
            position={[81.333, -190.091, 556.767]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door020"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door020.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door020_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door020_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top020"
            position={[81.333, -190.091, 514.233]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door021"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door021.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door021_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door021_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top021"
            position={[81.333, -190.091, 528.233]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door022"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door022.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door022_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door022_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top022"
            position={[81.333, -190.091, 485.767]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door023"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door023.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door023_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door023_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top023"
            position={[81.333, -190.091, 499.767]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door024"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door024.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door024_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door024_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top024"
            position={[81.333, -190.091, 457.233]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door025"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door025.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door025_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door025_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top025"
            position={[81.333, -190.091, 471.233]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door026"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door026.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door026_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door026_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top026"
            position={[81.333, -190.091, 428.767]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door027"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door027.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door027_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door027_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top027"
            position={[81.333, -190.091, 442.767]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door028"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door028.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door028_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door028_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top028"
            position={[81.333, -190.091, 400.233]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door029"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door029.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door029_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door029_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top029"
            position={[81.333, -190.091, 414.233]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door030"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door030.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door030_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door030_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top030"
            position={[81.333, -190.091, 371.767]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door031"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door031.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door031_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door031_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top031"
            position={[81.333, -190.091, 385.767]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door032"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door032.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door032_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door032_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top032"
            position={[81.333, -190.091, 343.233]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door033"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door033.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door033_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door033_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top033"
            position={[81.333, -190.091, 357.233]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door034"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door034.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door034_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door034_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top034"
            position={[81.333, -190.091, 314.767]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door035"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door035.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door035_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door035_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top035"
            position={[81.333, -190.091, 328.767]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door036"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door036.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door036_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door036_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top036"
            position={[81.333, -190.091, 286.233]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door037"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door037.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door037_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door037_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top037"
            position={[81.333, -190.091, 300.233]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door038"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door038.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door038_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door038_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top038"
            position={[81.333, -190.091, 257.152]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door039"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door039.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door039_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door039_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top039"
            position={[81.333, -190.091, 271.152]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door040"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door040.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door040_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door040_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top040"
            position={[81.333, -190.091, 228.618]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door041"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door041.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door041_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door041_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top041"
            position={[81.333, -190.091, 242.618]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door042"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door042.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door042_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door042_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top042"
            position={[81.333, -190.091, 200.152]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door043"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door043.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door043_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door043_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top043"
            position={[81.333, -190.091, 214.152]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door044"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door044.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door044_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door044_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top044"
            position={[81.333, -190.091, 171.618]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door045"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door045.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door045_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door045_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top045"
            position={[81.333, -190.091, 185.618]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door046"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door046.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door046_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door046_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top046"
            position={[81.333, -190.091, 140.64]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door047"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door047.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door047_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door047_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top047"
            position={[81.333, -190.091, 154.64]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door048"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door048.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door048_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door048_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top048"
            position={[81.333, -190.091, 112.106]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door049"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door049.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door049_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door049_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top049"
            position={[81.333, -190.091, 126.106]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door050"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door050.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door050_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door050_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top050"
            position={[81.333, -190.091, 83.64]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door051"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door051.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door051_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door051_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top051"
            position={[81.333, -190.091, 97.64]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door052"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door052.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door052_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door052_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top052"
            position={[81.333, -190.091, 55.106]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door053"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door053.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door053_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door053_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top053"
            position={[81.333, -190.091, 69.106]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door054"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door054.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door054_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door054_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top054"
            position={[81.333, -190.091, 25.767]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door055"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door055.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door055_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door055_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top055"
            position={[81.333, -190.091, 39.767]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door056"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door056.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door056_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door056_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top056"
            position={[81.333, -190.091, -2.767]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door057"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door057.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door057_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door057_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top057"
            position={[81.333, -190.091, 11.233]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door058"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door058.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door058_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door058_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top058"
            position={[81.333, -190.091, -31.233]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door059"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door059.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door059_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door059_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top059"
            position={[81.333, -190.091, -17.233]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door060"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door060.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door060_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door060_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top060"
            position={[81.333, -190.091, -59.767]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door061"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door061.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door061_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door061_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <group
            name="iron_door_top061"
            position={[81.333, -190.091, -45.767]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Iron_Door062"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door062.geometry}
              material={materials['iron_door_top.004']}
            />
            <mesh
              name="Iron_Door062_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door062_1.geometry}
              material={materials['iron_door_bottom.004']}
            />
          </group>
          <mesh
            name="iron_trapdoor005"
            castShadow
            receiveShadow
            geometry={nodes.iron_trapdoor005.geometry}
            material={materials['iron_trapdoor.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="lever005"
            castShadow
            receiveShadow
            geometry={nodes.lever005.geometry}
            material={materials['lever.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="light_gray_concrete001"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_concrete001.geometry}
            material={materials['light_gray_concrete.001']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="light_gray_concrete_powder005"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_concrete_powder005.geometry}
            material={materials['light_gray_concrete_powder.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="light_gray_wool002"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_wool002.geometry}
            material={materials['light_gray_wool.002']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <group
            name="mangrove_door_bottom001"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Mangrove_Door001"
              castShadow
              receiveShadow
              geometry={nodes.Mangrove_Door001.geometry}
              material={materials['mangrove_door_bottom.001']}
            />
            <mesh
              name="Mangrove_Door001_1"
              castShadow
              receiveShadow
              geometry={nodes.Mangrove_Door001_1.geometry}
              material={materials['mangrove_door_top.001']}
            />
          </group>
          <mesh
            name="mossy_cobblestone004"
            castShadow
            receiveShadow
            geometry={nodes.mossy_cobblestone004.geometry}
            material={materials['mossy_cobblestone.002']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="mud_bricks009"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks009.geometry}
            material={materials['mud_bricks.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="mud_bricks010"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks010.geometry}
            material={materials['mud_bricks.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <group
            name="mushroom_stem005"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Red_Mushroom_Block005"
              castShadow
              receiveShadow
              geometry={nodes.Red_Mushroom_Block005.geometry}
              material={materials['mushroom_stem.004']}
            />
            <mesh
              name="Red_Mushroom_Block005_1"
              castShadow
              receiveShadow
              geometry={nodes.Red_Mushroom_Block005_1.geometry}
              material={materials['mushroom_block_inside.002']}
            />
          </group>
          <mesh
            name="note_block"
            castShadow
            receiveShadow
            geometry={nodes.note_block.geometry}
            material={materials.note_block}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <group
            name="oak_door_top005"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Oak_Door005"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door005.geometry}
              material={materials['oak_door_top.004']}
            />
            <mesh
              name="Oak_Door005_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door005_1.geometry}
              material={materials['oak_door_bottom.004']}
            />
          </group>
          <mesh
            name="oak_planks027"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks027.geometry}
            material={materials['oak_planks.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="oak_planks028"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks028.geometry}
            material={materials['oak_planks.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="oak_planks029"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks029.geometry}
            material={materials['oak_planks.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="oak_planks030"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks030.geometry}
            material={materials['oak_planks.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="oak_planks031"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks031.geometry}
            material={materials['oak_planks.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="oak_planks032"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks032.geometry}
            material={materials['oak_planks.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="oak_trapdoor005"
            castShadow
            receiveShadow
            geometry={nodes.oak_trapdoor005.geometry}
            material={materials['oak_trapdoor.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <group
            name="piston_top005"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Piston_Head005"
              castShadow
              receiveShadow
              geometry={nodes.Piston_Head005.geometry}
              material={materials['piston_top.004']}
            />
            <mesh
              name="Piston_Head005_1"
              castShadow
              receiveShadow
              geometry={nodes.Piston_Head005_1.geometry}
              material={materials['piston_side.004']}
            />
          </group>
          <group
            name="pointed_dripstone_down_tip_merge001"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Pointed_Dripstone001"
              castShadow
              receiveShadow
              geometry={nodes.Pointed_Dripstone001.geometry}
              material={materials['pointed_dripstone_down_tip_merge.001']}
            />
            <mesh
              name="Pointed_Dripstone001_1"
              castShadow
              receiveShadow
              geometry={nodes.Pointed_Dripstone001_1.geometry}
              material={materials['pointed_dripstone_down_frustum.001']}
            />
            <mesh
              name="Pointed_Dripstone001_2"
              castShadow
              receiveShadow
              geometry={nodes.Pointed_Dripstone001_2.geometry}
              material={materials.pointed_dripstone_down_base}
            />
          </group>
          <mesh
            name="polished_andesite015"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite015.geometry}
            material={materials['polished_andesite.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="polished_andesite016"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite016.geometry}
            material={materials['polished_andesite.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="polished_andesite017"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite017.geometry}
            material={materials['polished_andesite.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="polished_andesite018"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite018.geometry}
            material={materials['polished_andesite.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="polished_deepslate005"
            castShadow
            receiveShadow
            geometry={nodes.polished_deepslate005.geometry}
            material={materials['polished_deepslate.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="polished_deepslate006"
            castShadow
            receiveShadow
            geometry={nodes.polished_deepslate006.geometry}
            material={materials['polished_deepslate.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <group
            name="pumpkin_stem007"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Pumpkin_Stem_age_7007"
              castShadow
              receiveShadow
              geometry={nodes.Pumpkin_Stem_age_7007.geometry}
              material={materials['pumpkin_stem.004']}
            />
            <mesh
              name="Pumpkin_Stem_age_7007_1"
              castShadow
              receiveShadow
              geometry={nodes.Pumpkin_Stem_age_7007_1.geometry}
              material={materials['attached_pumpkin_stem.004']}
            />
          </group>
          <group
            name="quartz_block_bottom008"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Quartz_Slab005"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab005.geometry}
              material={materials['quartz_block_bottom.004']}
            />
            <mesh
              name="Quartz_Slab005_1"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab005_1.geometry}
              material={materials['quartz_block_side.004']}
            />
            <mesh
              name="Quartz_Slab005_2"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab005_2.geometry}
              material={materials['quartz_block_top.004']}
            />
          </group>
          <mesh
            name="quartz_block_bottom009"
            castShadow
            receiveShadow
            geometry={nodes.quartz_block_bottom009.geometry}
            material={materials['quartz_block_bottom.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="quartz_block_bottom010"
            castShadow
            receiveShadow
            geometry={nodes.quartz_block_bottom010.geometry}
            material={materials['quartz_block_bottom.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <group
            name="quartz_block_side005"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Block_of_Quartz005"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz005.geometry}
              material={materials['quartz_block_side.004']}
            />
            <mesh
              name="Block_of_Quartz005_1"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz005_1.geometry}
              material={materials['quartz_block_top.004']}
            />
            <mesh
              name="Block_of_Quartz005_2"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz005_2.geometry}
              material={materials['quartz_bricks.004']}
            />
          </group>
          <mesh
            name="quartz_block_top008"
            castShadow
            receiveShadow
            geometry={nodes.quartz_block_top008.geometry}
            material={materials['quartz_block_top.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="quartz_block_top009"
            castShadow
            receiveShadow
            geometry={nodes.quartz_block_top009.geometry}
            material={materials['quartz_block_top.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="rail004"
            castShadow
            receiveShadow
            geometry={nodes.rail004.geometry}
            material={materials['rail.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="red_concrete_powder001"
            castShadow
            receiveShadow
            geometry={nodes.red_concrete_powder001.geometry}
            material={materials['red_concrete_powder.001']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="red_terracotta002"
            castShadow
            receiveShadow
            geometry={nodes.red_terracotta002.geometry}
            material={materials['red_terracotta.002']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="redstone_torch_off004"
            castShadow
            receiveShadow
            geometry={nodes.redstone_torch_off004.geometry}
            material={materials['redstone_torch_off.003']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="repeater004"
            castShadow
            receiveShadow
            geometry={nodes.repeater004.geometry}
            material={materials['repeater.003']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="rooted_dirt005"
            castShadow
            receiveShadow
            geometry={nodes.rooted_dirt005.geometry}
            material={materials['rooted_dirt.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="sand005"
            castShadow
            receiveShadow
            geometry={nodes.sand005.geometry}
            material={materials['sand.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="sandstone003"
            castShadow
            receiveShadow
            geometry={nodes.sandstone003.geometry}
            material={materials['sandstone.003']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <group
            name="sandstone_top001"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Cut_Sandstone"
              castShadow
              receiveShadow
              geometry={nodes.Cut_Sandstone.geometry}
              material={materials['sandstone_top.001']}
            />
            <mesh
              name="Cut_Sandstone_1"
              castShadow
              receiveShadow
              geometry={nodes.Cut_Sandstone_1.geometry}
              material={materials.cut_sandstone}
            />
          </group>
          <group
            name="sandstone_top002"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Cut_Sandstone_Slab"
              castShadow
              receiveShadow
              geometry={nodes.Cut_Sandstone_Slab.geometry}
              material={materials['sandstone_top.001']}
            />
            <mesh
              name="Cut_Sandstone_Slab_1"
              castShadow
              receiveShadow
              geometry={nodes.Cut_Sandstone_Slab_1.geometry}
              material={materials.cut_sandstone}
            />
          </group>
          <group
            name="sandstone_top003"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Sandstone003"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone003.geometry}
              material={materials['sandstone_top.001']}
            />
            <mesh
              name="Sandstone003_1"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone003_1.geometry}
              material={materials['sandstone.003']}
            />
            <mesh
              name="Sandstone003_2"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone003_2.geometry}
              material={materials['sandstone_bottom.003']}
            />
          </group>
          <group
            name="sandstone_top004"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Sandstone_Slab001"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone_Slab001.geometry}
              material={materials['sandstone_top.001']}
            />
            <mesh
              name="Sandstone_Slab001_1"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone_Slab001_1.geometry}
              material={materials['sandstone.003']}
            />
            <mesh
              name="Sandstone_Slab001_2"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone_Slab001_2.geometry}
              material={materials['sandstone_bottom.003']}
            />
          </group>
          <group
            name="sandstone_top005"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Sandstone_Stairs"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone_Stairs.geometry}
              material={materials['sandstone_top.001']}
            />
            <mesh
              name="Sandstone_Stairs_1"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone_Stairs_1.geometry}
              material={materials['sandstone.003']}
            />
            <mesh
              name="Sandstone_Stairs_2"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone_Stairs_2.geometry}
              material={materials['sandstone_bottom.003']}
            />
          </group>
          <mesh
            name="sandstone_top006"
            castShadow
            receiveShadow
            geometry={nodes.sandstone_top006.geometry}
            material={materials['sandstone_top.001']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="sandstone_top007"
            castShadow
            receiveShadow
            geometry={nodes.sandstone_top007.geometry}
            material={materials['sandstone_top.001']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="sandstone_top008"
            castShadow
            receiveShadow
            geometry={nodes.sandstone_top008.geometry}
            material={materials['sandstone_top.001']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <group
            name="scaffolding_top"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Scaffolding001"
              castShadow
              receiveShadow
              geometry={nodes.Scaffolding001.geometry}
              material={materials.scaffolding_top}
            />
            <mesh
              name="Scaffolding001_1"
              castShadow
              receiveShadow
              geometry={nodes.Scaffolding001_1.geometry}
              material={materials['scaffolding_side.001']}
            />
            <mesh
              name="Scaffolding001_2"
              castShadow
              receiveShadow
              geometry={nodes.Scaffolding001_2.geometry}
              material={materials['scaffolding_bottom.001']}
            />
          </group>
          <mesh
            name="smooth_stone006"
            castShadow
            receiveShadow
            geometry={nodes.smooth_stone006.geometry}
            material={materials['smooth_stone.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="snow010"
            castShadow
            receiveShadow
            geometry={nodes.snow010.geometry}
            material={materials['snow.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="snow011"
            castShadow
            receiveShadow
            geometry={nodes.snow011.geometry}
            material={materials['snow.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="spruce_planks005"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks005.geometry}
            material={materials['spruce_planks.003']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="stone016"
            castShadow
            receiveShadow
            geometry={nodes.stone016.geometry}
            material={materials['stone.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="stone017"
            castShadow
            receiveShadow
            geometry={nodes.stone017.geometry}
            material={materials['stone.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="stone_bricks020"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks020.geometry}
            material={materials['stone_bricks.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="stone_bricks021"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks021.geometry}
            material={materials['stone_bricks.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="stone_bricks022"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks022.geometry}
            material={materials['stone_bricks.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="stone_bricks023"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks023.geometry}
            material={materials['stone_bricks.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <group
            name="stripped_birch_log002"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="Stripped_Birch_Log001"
              castShadow
              receiveShadow
              geometry={nodes.Stripped_Birch_Log001.geometry}
              material={materials['stripped_birch_log.001']}
            />
            <mesh
              name="Stripped_Birch_Log001_1"
              castShadow
              receiveShadow
              geometry={nodes.Stripped_Birch_Log001_1.geometry}
              material={materials['stripped_birch_log_top.001']}
            />
          </group>
          <mesh
            name="stripped_birch_log003"
            castShadow
            receiveShadow
            geometry={nodes.stripped_birch_log003.geometry}
            material={materials['stripped_birch_log.001']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="stripped_mangrove_log001"
            castShadow
            receiveShadow
            geometry={nodes.stripped_mangrove_log001.geometry}
            material={materials['stripped_mangrove_log.001']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="stripped_oak_log002"
            castShadow
            receiveShadow
            geometry={nodes.stripped_oak_log002.geometry}
            material={materials['stripped_oak_log.002']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="stripped_spruce_log004"
            castShadow
            receiveShadow
            geometry={nodes.stripped_spruce_log004.geometry}
            material={materials['stripped_spruce_log.003']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="stripped_warped_stem004"
            castShadow
            receiveShadow
            geometry={nodes.stripped_warped_stem004.geometry}
            material={materials['stripped_warped_stem.003']}
            position={[-144.295, -174.955, 167.363]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="tall_grass_bottom001"
            castShadow
            receiveShadow
            geometry={nodes.tall_grass_bottom001.geometry}
            material={materials['tall_grass_bottom.001']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="torchflower001"
            castShadow
            receiveShadow
            geometry={nodes.torchflower001.geometry}
            material={materials['torchflower.001']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="tripwire_hook005"
            castShadow
            receiveShadow
            geometry={nodes.tripwire_hook005.geometry}
            material={materials['tripwire_hook.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="tuff005"
            castShadow
            receiveShadow
            geometry={nodes.tuff005.geometry}
            material={materials['tuff.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="white_candle005"
            castShadow
            receiveShadow
            geometry={nodes.white_candle005.geometry}
            material={materials['white_candle.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="white_concrete"
            castShadow
            receiveShadow
            geometry={nodes.white_concrete.geometry}
            material={materials.white_concrete}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="white_concrete_powder005"
            castShadow
            receiveShadow
            geometry={nodes.white_concrete_powder005.geometry}
            material={materials['white_concrete_powder.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <group
            name="white_shulker_box004"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="White_Shulker_Box005"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box005.geometry}
              material={materials['white_shulker_box.003']}
            />
            <mesh
              name="White_Shulker_Box005_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box005_1.geometry}
              material={materials['shulker_side_white.004']}
            />
            <mesh
              name="White_Shulker_Box005_2"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box005_2.geometry}
              material={materials['shulker_bottom_white.004']}
            />
          </group>
          <mesh
            name="white_stained_glass005"
            castShadow
            receiveShadow
            geometry={nodes.white_stained_glass005.geometry}
            material={materials['white_stained_glass.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <group
            name="white_stained_glass006"
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}>
            <mesh
              name="White_Stained_Glass_Pane005"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane005.geometry}
              material={materials['white_stained_glass.004']}
            />
            <mesh
              name="White_Stained_Glass_Pane005_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane005_1.geometry}
              material={materials['white_stained_glass_pane_top.004']}
            />
          </group>
          <mesh
            name="white_wool009"
            castShadow
            receiveShadow
            geometry={nodes.white_wool009.geometry}
            material={materials['white_wool.004']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
          <mesh
            name="wither_rose001"
            castShadow
            receiveShadow
            geometry={nodes.wither_rose001.geometry}
            material={materials['wither_rose.001']}
            position={[-81.273, -187.894, 26.151]}
            rotation={[Math.PI / 2, 0, Math.PI / 2]}
            scale={1.781}
          />
        </group>
        <group name="(2)_mcprep_empty006" position={[0, 191, 0]}>
          <group
            name="bricks003"
            position={[124.278, -187.467, 109.451]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.828}>
            <mesh
              name="Bricks001"
              castShadow
              receiveShadow
              geometry={nodes.Bricks001.geometry}
              material={materials['bricks.002']}
            />
            <mesh
              name="Bricks001_1"
              castShadow
              receiveShadow
              geometry={nodes.Bricks001_1.geometry}
              material={materials.daylight_detector_side}
            />
            <mesh
              name="Bricks001_2"
              castShadow
              receiveShadow
              geometry={nodes.Bricks001_2.geometry}
              material={materials.daylight_detector_top}
            />
            <mesh
              name="Bricks001_3"
              castShadow
              receiveShadow
              geometry={nodes.Bricks001_3.geometry}
              material={materials['granite.005']}
            />
            <mesh
              name="Bricks001_4"
              castShadow
              receiveShadow
              geometry={nodes.Bricks001_4.geometry}
              material={materials['mangrove_door_bottom.002']}
            />
            <mesh
              name="Bricks001_5"
              castShadow
              receiveShadow
              geometry={nodes.Bricks001_5.geometry}
              material={materials['mangrove_door_top.002']}
            />
            <mesh
              name="Bricks001_6"
              castShadow
              receiveShadow
              geometry={nodes.Bricks001_6.geometry}
              material={materials['piston_side.005']}
            />
            <mesh
              name="Bricks001_7"
              castShadow
              receiveShadow
              geometry={nodes.Bricks001_7.geometry}
              material={materials.red_sandstone_bottom}
            />
            <mesh
              name="Bricks001_8"
              castShadow
              receiveShadow
              geometry={nodes.Bricks001_8.geometry}
              material={materials['red_sandstone.001']}
            />
            <mesh
              name="Bricks001_9"
              castShadow
              receiveShadow
              geometry={nodes.Bricks001_9.geometry}
              material={materials['white_concrete.001']}
            />
          </group>
          <group
            name="bricks006"
            position={[85.168, -187.467, 347.643]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.828}>
            <mesh
              name="Bricks004"
              castShadow
              receiveShadow
              geometry={nodes.Bricks004.geometry}
              material={materials['bricks.002']}
            />
            <mesh
              name="Bricks004_1"
              castShadow
              receiveShadow
              geometry={nodes.Bricks004_1.geometry}
              material={materials.daylight_detector_side}
            />
            <mesh
              name="Bricks004_2"
              castShadow
              receiveShadow
              geometry={nodes.Bricks004_2.geometry}
              material={materials.daylight_detector_top}
            />
            <mesh
              name="Bricks004_3"
              castShadow
              receiveShadow
              geometry={nodes.Bricks004_3.geometry}
              material={materials['granite.005']}
            />
            <mesh
              name="Bricks004_4"
              castShadow
              receiveShadow
              geometry={nodes.Bricks004_4.geometry}
              material={materials['mangrove_door_bottom.002']}
            />
            <mesh
              name="Bricks004_5"
              castShadow
              receiveShadow
              geometry={nodes.Bricks004_5.geometry}
              material={materials['mangrove_door_top.002']}
            />
            <mesh
              name="Bricks004_6"
              castShadow
              receiveShadow
              geometry={nodes.Bricks004_6.geometry}
              material={materials['piston_side.005']}
            />
            <mesh
              name="Bricks004_7"
              castShadow
              receiveShadow
              geometry={nodes.Bricks004_7.geometry}
              material={materials.red_sandstone_bottom}
            />
            <mesh
              name="Bricks004_8"
              castShadow
              receiveShadow
              geometry={nodes.Bricks004_8.geometry}
              material={materials['red_sandstone.001']}
            />
            <mesh
              name="Bricks004_9"
              castShadow
              receiveShadow
              geometry={nodes.Bricks004_9.geometry}
              material={materials['white_concrete.001']}
            />
          </group>
        </group>
        <group name="(2)_mcprep_empty007" position={[0, 191, 0]}>
          <mesh
            name="acacia_log006"
            castShadow
            receiveShadow
            geometry={nodes.acacia_log006.geometry}
            material={materials['acacia_log.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="acacia_sapling"
            castShadow
            receiveShadow
            geometry={nodes.acacia_sapling.geometry}
            material={materials.acacia_sapling}
            position={[105.804, -191, -489.153]}
            rotation={[Math.PI / 2, 0, Math.PI]}
          />
          <mesh
            name="allium"
            castShadow
            receiveShadow
            geometry={nodes.allium.geometry}
            material={materials.allium}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="andesite028"
            castShadow
            receiveShadow
            geometry={nodes.andesite028.geometry}
            material={materials['andesite.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="andesite029"
            castShadow
            receiveShadow
            geometry={nodes.andesite029.geometry}
            material={materials['andesite.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="andesite030"
            castShadow
            receiveShadow
            geometry={nodes.andesite030.geometry}
            material={materials['andesite.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="andesite031"
            castShadow
            receiveShadow
            geometry={nodes.andesite031.geometry}
            material={materials['andesite.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="andesite032"
            castShadow
            receiveShadow
            geometry={nodes.andesite032.geometry}
            material={materials['andesite.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="anvil"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Anvil"
              castShadow
              receiveShadow
              geometry={nodes.Anvil.geometry}
              material={materials.anvil}
            />
            <mesh
              name="Anvil_1"
              castShadow
              receiveShadow
              geometry={nodes.Anvil_1.geometry}
              material={materials.anvil_top}
            />
          </group>
          <mesh
            name="azalea_leaves"
            castShadow
            receiveShadow
            geometry={nodes.azalea_leaves.geometry}
            material={materials.azalea_leaves}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="azure_bluet"
            castShadow
            receiveShadow
            geometry={nodes.azure_bluet.geometry}
            material={materials.azure_bluet}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="bamboo_block"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Block_of_Bamboo"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Bamboo.geometry}
              material={materials.bamboo_block}
            />
            <mesh
              name="Block_of_Bamboo_1"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Bamboo_1.geometry}
              material={materials.bamboo_block_top}
            />
          </group>
          <group
            name="bamboo_door_bottom"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Bamboo_Door"
              castShadow
              receiveShadow
              geometry={nodes.Bamboo_Door.geometry}
              material={materials.bamboo_door_bottom}
            />
            <mesh
              name="Bamboo_Door_1"
              castShadow
              receiveShadow
              geometry={nodes.Bamboo_Door_1.geometry}
              material={materials.bamboo_door_top}
            />
          </group>
          <mesh
            name="bamboo_fence_gate_particle"
            castShadow
            receiveShadow
            geometry={nodes.bamboo_fence_gate_particle.geometry}
            material={materials.bamboo_fence_gate_particle}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="bamboo_fence_particle"
            castShadow
            receiveShadow
            geometry={nodes.bamboo_fence_particle.geometry}
            material={materials.bamboo_fence_particle}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="bamboo_mosaic"
            castShadow
            receiveShadow
            geometry={nodes.bamboo_mosaic.geometry}
            material={materials.bamboo_mosaic}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="bamboo_mosaic001"
            castShadow
            receiveShadow
            geometry={nodes.bamboo_mosaic001.geometry}
            material={materials.bamboo_mosaic}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="bamboo_planks002"
            castShadow
            receiveShadow
            geometry={nodes.bamboo_planks002.geometry}
            material={materials['bamboo_planks.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="bamboo_planks003"
            castShadow
            receiveShadow
            geometry={nodes.bamboo_planks003.geometry}
            material={materials['bamboo_planks.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="bamboo_planks004"
            castShadow
            receiveShadow
            geometry={nodes.bamboo_planks004.geometry}
            material={materials['bamboo_planks.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="bamboo_planks005"
            castShadow
            receiveShadow
            geometry={nodes.bamboo_planks005.geometry}
            material={materials['bamboo_planks.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="bamboo_planks006"
            castShadow
            receiveShadow
            geometry={nodes.bamboo_planks006.geometry}
            material={materials['bamboo_planks.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="bamboo_trapdoor"
            castShadow
            receiveShadow
            geometry={nodes.bamboo_trapdoor.geometry}
            material={materials.bamboo_trapdoor}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="basalt_top"
            castShadow
            receiveShadow
            geometry={nodes.basalt_top.geometry}
            material={materials.basalt_top}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="bedrock006"
            castShadow
            receiveShadow
            geometry={nodes.bedrock006.geometry}
            material={materials['bedrock.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="bee_nest_front"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Bee_Nest"
              castShadow
              receiveShadow
              geometry={nodes.Bee_Nest.geometry}
              material={materials.bee_nest_front}
            />
            <mesh
              name="Bee_Nest_1"
              castShadow
              receiveShadow
              geometry={nodes.Bee_Nest_1.geometry}
              material={materials.bee_nest_side}
            />
            <mesh
              name="Bee_Nest_2"
              castShadow
              receiveShadow
              geometry={nodes.Bee_Nest_2.geometry}
              material={materials.bee_nest_top}
            />
          </group>
          <group
            name="beehive_end002"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Beehive003"
              castShadow
              receiveShadow
              geometry={nodes.Beehive003.geometry}
              material={materials['beehive_end.002']}
            />
            <mesh
              name="Beehive003_1"
              castShadow
              receiveShadow
              geometry={nodes.Beehive003_1.geometry}
              material={materials['beehive_front.001']}
            />
            <mesh
              name="Beehive003_2"
              castShadow
              receiveShadow
              geometry={nodes.Beehive003_2.geometry}
              material={materials['beehive_side.003']}
            />
          </group>
          <group
            name="birch_log"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Birch_Sign"
              castShadow
              receiveShadow
              geometry={nodes.Birch_Sign.geometry}
              material={materials.birch_log}
            />
            <mesh
              name="Birch_Sign_1"
              castShadow
              receiveShadow
              geometry={nodes.Birch_Sign_1.geometry}
              material={materials.spruce_log_top}
            />
            <mesh
              name="Birch_Sign_2"
              castShadow
              receiveShadow
              geometry={nodes.Birch_Sign_2.geometry}
              material={materials['birch_planks.005']}
            />
          </group>
          <mesh
            name="birch_log001"
            castShadow
            receiveShadow
            geometry={nodes.birch_log001.geometry}
            material={materials.birch_log}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="birch_planks019"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks019.geometry}
            material={materials['birch_planks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="birch_planks020"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks020.geometry}
            material={materials['birch_planks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="birch_planks021"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks021.geometry}
            material={materials['birch_planks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="birch_planks022"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks022.geometry}
            material={materials['birch_planks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="birch_planks023"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks023.geometry}
            material={materials['birch_planks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="birch_planks024"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks024.geometry}
            material={materials['birch_planks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="birch_trapdoor002"
            castShadow
            receiveShadow
            geometry={nodes.birch_trapdoor002.geometry}
            material={materials['birch_trapdoor.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="black_concrete003"
            castShadow
            receiveShadow
            geometry={nodes.black_concrete003.geometry}
            material={materials['black_concrete.003']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="black_concrete_powder003"
            castShadow
            receiveShadow
            geometry={nodes.black_concrete_powder003.geometry}
            material={materials['black_concrete_powder.003']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="black_stained_glass001"
            castShadow
            receiveShadow
            geometry={nodes.black_stained_glass001.geometry}
            material={materials['black_stained_glass.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="black_stained_glass002"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Black_Stained_Glass_Pane001"
              castShadow
              receiveShadow
              geometry={nodes.Black_Stained_Glass_Pane001.geometry}
              material={materials['black_stained_glass.001']}
            />
            <mesh
              name="Black_Stained_Glass_Pane001_1"
              castShadow
              receiveShadow
              geometry={nodes.Black_Stained_Glass_Pane001_1.geometry}
              material={materials['black_stained_glass_pane_top.001']}
            />
          </group>
          <mesh
            name="blackstone004"
            castShadow
            receiveShadow
            geometry={nodes.blackstone004.geometry}
            material={materials['blackstone.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="blue_ice005"
            castShadow
            receiveShadow
            geometry={nodes.blue_ice005.geometry}
            material={materials['blue_ice.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="blue_wool"
            castShadow
            receiveShadow
            geometry={nodes.blue_wool.geometry}
            material={materials.blue_wool}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="bone_block_side006"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Bone_Block006"
              castShadow
              receiveShadow
              geometry={nodes.Bone_Block006.geometry}
              material={materials['bone_block_side.005']}
            />
            <mesh
              name="Bone_Block006_1"
              castShadow
              receiveShadow
              geometry={nodes.Bone_Block006_1.geometry}
              material={materials['bone_block_top.005']}
            />
          </group>
          <group
            name="brewing_stand_base003"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Brewing_Stand003"
              castShadow
              receiveShadow
              geometry={nodes.Brewing_Stand003.geometry}
              material={materials['brewing_stand_base.003']}
            />
            <mesh
              name="Brewing_Stand003_1"
              castShadow
              receiveShadow
              geometry={nodes.Brewing_Stand003_1.geometry}
              material={materials['brewing_stand.003']}
            />
          </group>
          <mesh
            name="bricks004"
            castShadow
            receiveShadow
            geometry={nodes.bricks004.geometry}
            material={materials['bricks.003']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="bricks005"
            castShadow
            receiveShadow
            geometry={nodes.bricks005.geometry}
            material={materials['bricks.003']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="brown_mushroom006"
            castShadow
            receiveShadow
            geometry={nodes.brown_mushroom006.geometry}
            material={materials['brown_mushroom.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="brown_mushroom_block004"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Brown_Mushroom_Block004"
              castShadow
              receiveShadow
              geometry={nodes.Brown_Mushroom_Block004.geometry}
              material={materials['brown_mushroom_block.003']}
            />
            <mesh
              name="Brown_Mushroom_Block004_1"
              castShadow
              receiveShadow
              geometry={nodes.Brown_Mushroom_Block004_1.geometry}
              material={materials['mushroom_block_inside.003']}
            />
          </group>
          <mesh
            name="brown_wool"
            castShadow
            receiveShadow
            geometry={nodes.brown_wool.geometry}
            material={materials.brown_wool}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="calcite006"
            castShadow
            receiveShadow
            geometry={nodes.calcite006.geometry}
            material={materials['calcite.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="candle001"
            castShadow
            receiveShadow
            geometry={nodes.candle001.geometry}
            material={materials['candle.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="chain006"
            castShadow
            receiveShadow
            geometry={nodes.chain006.geometry}
            material={materials['chain.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="chiseled_deepslate"
            castShadow
            receiveShadow
            geometry={nodes.chiseled_deepslate.geometry}
            material={materials.chiseled_deepslate}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="clay006"
            castShadow
            receiveShadow
            geometry={nodes.clay006.geometry}
            material={materials['clay.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="cobbled_deepslate018"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate018.geometry}
            material={materials['cobbled_deepslate.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="cobbled_deepslate019"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate019.geometry}
            material={materials['cobbled_deepslate.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="cobbled_deepslate020"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate020.geometry}
            material={materials['cobbled_deepslate.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="cobbled_deepslate021"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate021.geometry}
            material={materials['cobbled_deepslate.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="cobbled_deepslate022"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate022.geometry}
            material={materials['cobbled_deepslate.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="cobblestone020"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone020.geometry}
            material={materials['cobblestone.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="cobblestone021"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone021.geometry}
            material={materials['cobblestone.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="cobblestone022"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone022.geometry}
            material={materials['cobblestone.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="cobblestone023"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Cobblestone_Wall005"
              castShadow
              receiveShadow
              geometry={nodes.Cobblestone_Wall005.geometry}
              material={materials['cobblestone.005']}
            />
            <mesh
              name="Cobblestone_Wall005_1"
              castShadow
              receiveShadow
              geometry={nodes.Cobblestone_Wall005_1.geometry}
              material={materials['sandstone.004']}
            />
            <mesh
              name="Cobblestone_Wall005_2"
              castShadow
              receiveShadow
              geometry={nodes.Cobblestone_Wall005_2.geometry}
              material={materials['andesite.005']}
            />
            <mesh
              name="Cobblestone_Wall005_3"
              castShadow
              receiveShadow
              geometry={nodes.Cobblestone_Wall005_3.geometry}
              material={materials.red_nether_bricks}
            />
          </group>
          <mesh
            name="cobblestone024"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone024.geometry}
            material={materials['cobblestone.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="cyan_concrete_powder002"
            castShadow
            receiveShadow
            geometry={nodes.cyan_concrete_powder002.geometry}
            material={materials['cyan_concrete_powder.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="cyan_shulker_box"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Cyan_Shulker_Box"
              castShadow
              receiveShadow
              geometry={nodes.Cyan_Shulker_Box.geometry}
              material={materials.cyan_shulker_box}
            />
            <mesh
              name="Cyan_Shulker_Box_1"
              castShadow
              receiveShadow
              geometry={nodes.Cyan_Shulker_Box_1.geometry}
              material={materials.shulker_side_cyan}
            />
            <mesh
              name="Cyan_Shulker_Box_2"
              castShadow
              receiveShadow
              geometry={nodes.Cyan_Shulker_Box_2.geometry}
              material={materials.shulker_bottom_cyan}
            />
          </group>
          <mesh
            name="cyan_wool001"
            castShadow
            receiveShadow
            geometry={nodes.cyan_wool001.geometry}
            material={materials['cyan_wool.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dandelion"
            castShadow
            receiveShadow
            geometry={nodes.dandelion.geometry}
            material={materials.dandelion}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="dark_oak_door_bottom"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Dark_Oak_Door"
              castShadow
              receiveShadow
              geometry={nodes.Dark_Oak_Door.geometry}
              material={materials.dark_oak_door_bottom}
            />
            <mesh
              name="Dark_Oak_Door_1"
              castShadow
              receiveShadow
              geometry={nodes.Dark_Oak_Door_1.geometry}
              material={materials.dark_oak_door_top}
            />
          </group>
          <group
            name="dark_oak_log006"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Grindstone006"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone006.geometry}
              material={materials['dark_oak_log.005']}
            />
            <mesh
              name="Grindstone006_1"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone006_1.geometry}
              material={materials['grindstone_side.005']}
            />
            <mesh
              name="Grindstone006_2"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone006_2.geometry}
              material={materials['grindstone_pivot.005']}
            />
            <mesh
              name="Grindstone006_3"
              castShadow
              receiveShadow
              geometry={nodes.Grindstone006_3.geometry}
              material={materials['grindstone_round.005']}
            />
          </group>
          <mesh
            name="dark_oak_planks007"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks007.geometry}
            material={materials['dark_oak_planks.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dark_oak_planks008"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks008.geometry}
            material={materials['dark_oak_planks.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dark_oak_planks009"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks009.geometry}
            material={materials['dark_oak_planks.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dark_oak_planks010"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks010.geometry}
            material={materials['dark_oak_planks.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dark_oak_trapdoor"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_trapdoor.geometry}
            material={materials.dark_oak_trapdoor}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dark_prismarine001"
            castShadow
            receiveShadow
            geometry={nodes.dark_prismarine001.geometry}
            material={materials['dark_prismarine.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dead_brain_coral001"
            castShadow
            receiveShadow
            geometry={nodes.dead_brain_coral001.geometry}
            material={materials['dead_brain_coral.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dead_brain_coral_block006"
            castShadow
            receiveShadow
            geometry={nodes.dead_brain_coral_block006.geometry}
            material={materials['dead_brain_coral_block.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dead_brain_coral_fan005"
            castShadow
            receiveShadow
            geometry={nodes.dead_brain_coral_fan005.geometry}
            material={materials['dead_brain_coral_fan.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dead_brain_coral_fan006"
            castShadow
            receiveShadow
            geometry={nodes.dead_brain_coral_fan006.geometry}
            material={materials['dead_brain_coral_fan.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dead_bubble_coral001"
            castShadow
            receiveShadow
            geometry={nodes.dead_bubble_coral001.geometry}
            material={materials['dead_bubble_coral.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dead_bubble_coral_block"
            castShadow
            receiveShadow
            geometry={nodes.dead_bubble_coral_block.geometry}
            material={materials.dead_bubble_coral_block}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dead_bubble_coral_fan005"
            castShadow
            receiveShadow
            geometry={nodes.dead_bubble_coral_fan005.geometry}
            material={materials['dead_bubble_coral_fan.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dead_bubble_coral_fan006"
            castShadow
            receiveShadow
            geometry={nodes.dead_bubble_coral_fan006.geometry}
            material={materials['dead_bubble_coral_fan.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dead_bush001"
            castShadow
            receiveShadow
            geometry={nodes.dead_bush001.geometry}
            material={materials['dead_bush.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dead_fire_coral003"
            castShadow
            receiveShadow
            geometry={nodes.dead_fire_coral003.geometry}
            material={materials['dead_fire_coral.003']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dead_fire_coral_fan001"
            castShadow
            receiveShadow
            geometry={nodes.dead_fire_coral_fan001.geometry}
            material={materials['dead_fire_coral_fan.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dead_horn_coral005"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral005.geometry}
            material={materials['dead_horn_coral.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dead_horn_coral_block"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral_block.geometry}
            material={materials.dead_horn_coral_block}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dead_horn_coral_fan012"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral_fan012.geometry}
            material={materials['dead_horn_coral_fan.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dead_horn_coral_fan013"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral_fan013.geometry}
            material={materials['dead_horn_coral_fan.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dead_tube_coral003"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral003.geometry}
            material={materials['dead_tube_coral.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dead_tube_coral_block"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral_block.geometry}
            material={materials.dead_tube_coral_block}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dead_tube_coral_fan011"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral_fan011.geometry}
            material={materials['dead_tube_coral_fan.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dead_tube_coral_fan012"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral_fan012.geometry}
            material={materials['dead_tube_coral_fan.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="deepslate_bricks014"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks014.geometry}
            material={materials['deepslate_bricks.006']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="deepslate_bricks015"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks015.geometry}
            material={materials['deepslate_bricks.006']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="deepslate_bricks016"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks016.geometry}
            material={materials['deepslate_bricks.006']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="deepslate_bricks017"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks017.geometry}
            material={materials['deepslate_bricks.006']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="deepslate_bricks018"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_bricks018.geometry}
            material={materials['deepslate_bricks.006']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="deepslate_coal_ore002"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_coal_ore002.geometry}
            material={materials['deepslate_coal_ore.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="deepslate_tiles013"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles013.geometry}
            material={materials['deepslate_tiles.006']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="deepslate_tiles014"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles014.geometry}
            material={materials['deepslate_tiles.006']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="deepslate_tiles015"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles015.geometry}
            material={materials['deepslate_tiles.006']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="deepslate_tiles016"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles016.geometry}
            material={materials['deepslate_tiles.006']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="deepslate_tiles017"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles017.geometry}
            material={materials['deepslate_tiles.006']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="deepslate_top007"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Deepslate007"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate007.geometry}
              material={materials['deepslate_top.006']}
            />
            <mesh
              name="Deepslate007_1"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate007_1.geometry}
              material={materials['deepslate.006']}
            />
          </group>
          <mesh
            name="diorite027"
            castShadow
            receiveShadow
            geometry={nodes.diorite027.geometry}
            material={materials['diorite.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="diorite028"
            castShadow
            receiveShadow
            geometry={nodes.diorite028.geometry}
            material={materials['diorite.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="diorite029"
            castShadow
            receiveShadow
            geometry={nodes.diorite029.geometry}
            material={materials['diorite.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="diorite030"
            castShadow
            receiveShadow
            geometry={nodes.diorite030.geometry}
            material={materials['diorite.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="diorite031"
            castShadow
            receiveShadow
            geometry={nodes.diorite031.geometry}
            material={materials['diorite.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="dirt011"
            castShadow
            receiveShadow
            geometry={nodes.dirt011.geometry}
            material={materials['dirt.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="dried_kelp_side"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Dried_Kelp_Block004"
              castShadow
              receiveShadow
              geometry={nodes.Dried_Kelp_Block004.geometry}
              material={materials['dried_kelp_side.003']}
            />
            <mesh
              name="Dried_Kelp_Block004_1"
              castShadow
              receiveShadow
              geometry={nodes.Dried_Kelp_Block004_1.geometry}
              material={materials['dried_kelp_bottom.003']}
            />
          </group>
          <mesh
            name="end_rod002"
            castShadow
            receiveShadow
            geometry={nodes.end_rod002.geometry}
            material={materials['end_rod.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="end_stone_bricks"
            castShadow
            receiveShadow
            geometry={nodes.end_stone_bricks.geometry}
            material={materials.end_stone_bricks}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="furnace_front"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Furnace002"
              castShadow
              receiveShadow
              geometry={nodes.Furnace002.geometry}
              material={materials.furnace_front}
            />
            <mesh
              name="Furnace002_1"
              castShadow
              receiveShadow
              geometry={nodes.Furnace002_1.geometry}
              material={materials['furnace_side.001']}
            />
          </group>
          <mesh
            name="glass"
            castShadow
            receiveShadow
            geometry={nodes.glass.geometry}
            material={materials.glass}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="glass001"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Glass_Pane"
              castShadow
              receiveShadow
              geometry={nodes.Glass_Pane.geometry}
              material={materials.glass}
            />
            <mesh
              name="Glass_Pane_1"
              castShadow
              receiveShadow
              geometry={nodes.Glass_Pane_1.geometry}
              material={materials.glass_pane_top}
            />
          </group>
          <mesh
            name="glow_lichen006"
            castShadow
            receiveShadow
            geometry={nodes.glow_lichen006.geometry}
            material={materials['glow_lichen.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="granite010"
            castShadow
            receiveShadow
            geometry={nodes.granite010.geometry}
            material={materials['granite.006']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="granite011"
            castShadow
            receiveShadow
            geometry={nodes.granite011.geometry}
            material={materials['granite.006']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="granite012"
            castShadow
            receiveShadow
            geometry={nodes.granite012.geometry}
            material={materials['granite.006']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="grass_block_top"
            castShadow
            receiveShadow
            geometry={nodes.grass_block_top.geometry}
            material={materials.grass_block_top}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="gravel006"
            castShadow
            receiveShadow
            geometry={nodes.gravel006.geometry}
            material={materials['gravel.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="gray_candle004"
            castShadow
            receiveShadow
            geometry={nodes.gray_candle004.geometry}
            material={materials['gray_candle.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="gray_concrete002"
            castShadow
            receiveShadow
            geometry={nodes.gray_concrete002.geometry}
            material={materials['gray_concrete.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="gray_concrete_powder004"
            castShadow
            receiveShadow
            geometry={nodes.gray_concrete_powder004.geometry}
            material={materials['gray_concrete_powder.003']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="gray_wool007"
            castShadow
            receiveShadow
            geometry={nodes.gray_wool007.geometry}
            material={materials['gray_wool.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="gray_wool008"
            castShadow
            receiveShadow
            geometry={nodes.gray_wool008.geometry}
            material={materials['gray_wool.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="green_concrete_powder"
            castShadow
            receiveShadow
            geometry={nodes.green_concrete_powder.geometry}
            material={materials.deepslate_tiles}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="green_wool"
            castShadow
            receiveShadow
            geometry={nodes.green_wool.geometry}
            material={materials.green_wool}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="green_wool001"
            castShadow
            receiveShadow
            geometry={nodes.green_wool001.geometry}
            material={materials.deepslate_bricks}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="hay_block_side005"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Hay_Bale005"
              castShadow
              receiveShadow
              geometry={nodes.Hay_Bale005.geometry}
              material={materials['hay_block_side.004']}
            />
            <mesh
              name="Hay_Bale005_1"
              castShadow
              receiveShadow
              geometry={nodes.Hay_Bale005_1.geometry}
              material={materials['hay_block_top.004']}
            />
          </group>
          <group
            name="hopper_inside004"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Hopper004"
              castShadow
              receiveShadow
              geometry={nodes.Hopper004.geometry}
              material={materials['hopper_inside.003']}
            />
            <mesh
              name="Hopper004_1"
              castShadow
              receiveShadow
              geometry={nodes.Hopper004_1.geometry}
              material={materials['hopper_outside.003']}
            />
            <mesh
              name="Hopper004_2"
              castShadow
              receiveShadow
              geometry={nodes.Hopper004_2.geometry}
              material={materials['hopper_top.002']}
            />
          </group>
          <mesh
            name="iron_bars005"
            castShadow
            receiveShadow
            geometry={nodes.iron_bars005.geometry}
            material={materials['iron_bars.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="iron_block010"
            castShadow
            receiveShadow
            geometry={nodes.iron_block010.geometry}
            material={materials['iron_block.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="iron_door_top006"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Iron_Door006"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door006.geometry}
              material={materials['iron_door_top.005']}
            />
            <mesh
              name="Iron_Door006_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door006_1.geometry}
              material={materials['iron_door_bottom.005']}
            />
          </group>
          <mesh
            name="iron_trapdoor006"
            castShadow
            receiveShadow
            geometry={nodes.iron_trapdoor006.geometry}
            material={materials['iron_trapdoor.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="jungle_planks001"
            castShadow
            receiveShadow
            geometry={nodes.jungle_planks001.geometry}
            material={materials['jungle_planks.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="jungle_planks002"
            castShadow
            receiveShadow
            geometry={nodes.jungle_planks002.geometry}
            material={materials['jungle_planks.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="jungle_trapdoor"
            castShadow
            receiveShadow
            geometry={nodes.jungle_trapdoor.geometry}
            material={materials.jungle_trapdoor}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="ladder"
            castShadow
            receiveShadow
            geometry={nodes.ladder.geometry}
            material={materials.ladder}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="lever006"
            castShadow
            receiveShadow
            geometry={nodes.lever006.geometry}
            material={materials['lever.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="light_blue_wool"
            castShadow
            receiveShadow
            geometry={nodes.light_blue_wool.geometry}
            material={materials.light_blue_wool}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="light_gray_concrete_powder006"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_concrete_powder006.geometry}
            material={materials['light_gray_concrete_powder.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="light_gray_glazed_terracotta"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_glazed_terracotta.geometry}
            material={materials.light_gray_glazed_terracotta}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="light_gray_shulker_box"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Light_Grey_Shulker_Box"
              castShadow
              receiveShadow
              geometry={nodes.Light_Grey_Shulker_Box.geometry}
              material={materials.light_gray_shulker_box}
            />
            <mesh
              name="Light_Grey_Shulker_Box_1"
              castShadow
              receiveShadow
              geometry={nodes.Light_Grey_Shulker_Box_1.geometry}
              material={materials.shulker_side_silver}
            />
            <mesh
              name="Light_Grey_Shulker_Box_2"
              castShadow
              receiveShadow
              geometry={nodes.Light_Grey_Shulker_Box_2.geometry}
              material={materials.shulker_bottom_silver}
            />
          </group>
          <group
            name="light_gray_stained_glass001"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Light_Stained_Glass_Pane001"
              castShadow
              receiveShadow
              geometry={nodes.Light_Stained_Glass_Pane001.geometry}
              material={materials['light_gray_stained_glass.001']}
            />
            <mesh
              name="Light_Stained_Glass_Pane001_1"
              castShadow
              receiveShadow
              geometry={nodes.Light_Stained_Glass_Pane001_1.geometry}
              material={materials['light_gray_stained_glass_pane_top.001']}
            />
          </group>
          <mesh
            name="light_gray_wool003"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_wool003.geometry}
            material={materials['light_gray_wool.003']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="light_gray_wool004"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_wool004.geometry}
            material={materials['light_gray_wool.003']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="lightning_rod001"
            castShadow
            receiveShadow
            geometry={nodes.lightning_rod001.geometry}
            material={materials['lightning_rod.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="lilac_bottom"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Lilac"
              castShadow
              receiveShadow
              geometry={nodes.Lilac.geometry}
              material={materials.lilac_bottom}
            />
            <mesh
              name="Lilac_1"
              castShadow
              receiveShadow
              geometry={nodes.Lilac_1.geometry}
              material={materials.lilac_top}
            />
          </group>
          <mesh
            name="lily_of_the_valley001"
            castShadow
            receiveShadow
            geometry={nodes.lily_of_the_valley001.geometry}
            material={materials['lily_of_the_valley.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="lime_wool"
            castShadow
            receiveShadow
            geometry={nodes.lime_wool.geometry}
            material={materials.lime_wool}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="loom_side003"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Loom004"
              castShadow
              receiveShadow
              geometry={nodes.Loom004.geometry}
              material={materials['loom_side.003']}
            />
            <mesh
              name="Loom004_1"
              castShadow
              receiveShadow
              geometry={nodes.Loom004_1.geometry}
              material={materials['loom_front.001']}
            />
          </group>
          <mesh
            name="magenta_wool"
            castShadow
            receiveShadow
            geometry={nodes.magenta_wool.geometry}
            material={materials.magenta_wool}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="mangrove_planks005"
            castShadow
            receiveShadow
            geometry={nodes.mangrove_planks005.geometry}
            material={materials['mangrove_planks.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="mangrove_planks006"
            castShadow
            receiveShadow
            geometry={nodes.mangrove_planks006.geometry}
            material={materials['mangrove_planks.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="mangrove_planks007"
            castShadow
            receiveShadow
            geometry={nodes.mangrove_planks007.geometry}
            material={materials['mangrove_planks.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="mangrove_trapdoor001"
            castShadow
            receiveShadow
            geometry={nodes.mangrove_trapdoor001.geometry}
            material={materials['mangrove_trapdoor.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="melon_stem"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Melon_Stem_age_7"
              castShadow
              receiveShadow
              geometry={nodes.Melon_Stem_age_7.geometry}
              material={materials.melon_stem}
            />
            <mesh
              name="Melon_Stem_age_7_1"
              castShadow
              receiveShadow
              geometry={nodes.Melon_Stem_age_7_1.geometry}
              material={materials.attached_melon_stem}
            />
          </group>
          <mesh
            name="moss_block"
            castShadow
            receiveShadow
            geometry={nodes.moss_block.geometry}
            material={materials.deepslate}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="mossy_cobblestone005"
            castShadow
            receiveShadow
            geometry={nodes.mossy_cobblestone005.geometry}
            material={materials['mossy_cobblestone.003']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="mossy_stone_bricks001"
            castShadow
            receiveShadow
            geometry={nodes.mossy_stone_bricks001.geometry}
            material={materials['mossy_stone_bricks.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="mossy_stone_bricks002"
            castShadow
            receiveShadow
            geometry={nodes.mossy_stone_bricks002.geometry}
            material={materials['mossy_stone_bricks.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="mud"
            castShadow
            receiveShadow
            geometry={nodes.mud.geometry}
            material={materials.mud}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="mud_bricks011"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks011.geometry}
            material={materials['mud_bricks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="mud_bricks012"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks012.geometry}
            material={materials['mud_bricks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="mushroom_stem006"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Red_Mushroom_Block006"
              castShadow
              receiveShadow
              geometry={nodes.Red_Mushroom_Block006.geometry}
              material={materials['mushroom_stem.005']}
            />
            <mesh
              name="Red_Mushroom_Block006_1"
              castShadow
              receiveShadow
              geometry={nodes.Red_Mushroom_Block006_1.geometry}
              material={materials['mushroom_block_inside.003']}
            />
          </group>
          <mesh
            name="nether_bricks"
            castShadow
            receiveShadow
            geometry={nodes.nether_bricks.geometry}
            material={materials.nether_bricks}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="oak_door_top006"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Oak_Door006"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door006.geometry}
              material={materials['oak_door_top.005']}
            />
            <mesh
              name="Oak_Door006_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door006_1.geometry}
              material={materials['oak_door_bottom.005']}
            />
          </group>
          <mesh
            name="oak_planks033"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks033.geometry}
            material={materials['oak_planks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="oak_planks034"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks034.geometry}
            material={materials['oak_planks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="oak_planks035"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks035.geometry}
            material={materials['oak_planks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="oak_planks036"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Lectern003"
              castShadow
              receiveShadow
              geometry={nodes.Lectern003.geometry}
              material={materials['oak_planks.005']}
            />
            <mesh
              name="Lectern003_1"
              castShadow
              receiveShadow
              geometry={nodes.Lectern003_1.geometry}
              material={materials['lectern_top.002']}
            />
            <mesh
              name="Lectern003_2"
              castShadow
              receiveShadow
              geometry={nodes.Lectern003_2.geometry}
              material={materials['lectern_sides.002']}
            />
            <mesh
              name="Lectern003_3"
              castShadow
              receiveShadow
              geometry={nodes.Lectern003_3.geometry}
              material={materials['lectern_base.002']}
            />
            <mesh
              name="Lectern003_4"
              castShadow
              receiveShadow
              geometry={nodes.Lectern003_4.geometry}
              material={materials['lectern_front.002']}
            />
          </group>
          <mesh
            name="oak_planks037"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks037.geometry}
            material={materials['oak_planks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="oak_planks038"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks038.geometry}
            material={materials['oak_planks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="oak_planks039"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks039.geometry}
            material={materials['oak_planks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="oak_planks040"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks040.geometry}
            material={materials['oak_planks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="oak_planks041"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks041.geometry}
            material={materials['oak_planks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="oak_trapdoor006"
            castShadow
            receiveShadow
            geometry={nodes.oak_trapdoor006.geometry}
            material={materials['oak_trapdoor.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="ochre_froglight_top"
            castShadow
            receiveShadow
            geometry={nodes.ochre_froglight_top.geometry}
            material={materials.ochre_froglight_top}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="orange_stained_glass"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Orange_Stained_Glass_Pane"
              castShadow
              receiveShadow
              geometry={nodes.Orange_Stained_Glass_Pane.geometry}
              material={materials.orange_stained_glass}
            />
            <mesh
              name="Orange_Stained_Glass_Pane_1"
              castShadow
              receiveShadow
              geometry={nodes.Orange_Stained_Glass_Pane_1.geometry}
              material={materials.orange_stained_glass_pane_top}
            />
          </group>
          <mesh
            name="orange_wool"
            castShadow
            receiveShadow
            geometry={nodes.orange_wool.geometry}
            material={materials.orange_wool}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="oxidized_cut_copper"
            castShadow
            receiveShadow
            geometry={nodes.oxidized_cut_copper.geometry}
            material={materials.oxidized_cut_copper}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="oxidized_cut_copper001"
            castShadow
            receiveShadow
            geometry={nodes.oxidized_cut_copper001.geometry}
            material={materials.oxidized_cut_copper}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="peony_bottom"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Peony"
              castShadow
              receiveShadow
              geometry={nodes.Peony.geometry}
              material={materials.peony_bottom}
            />
            <mesh
              name="Peony_1"
              castShadow
              receiveShadow
              geometry={nodes.Peony_1.geometry}
              material={materials.peony_top}
            />
          </group>
          <mesh
            name="pink_concrete"
            castShadow
            receiveShadow
            geometry={nodes.pink_concrete.geometry}
            material={materials.pink_concrete}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="pink_petals"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Pink_Petals"
              castShadow
              receiveShadow
              geometry={nodes.Pink_Petals.geometry}
              material={materials.pink_petals}
            />
            <mesh
              name="Pink_Petals_1"
              castShadow
              receiveShadow
              geometry={nodes.Pink_Petals_1.geometry}
              material={materials.pink_petals_stem}
            />
          </group>
          <mesh
            name="pink_tulip"
            castShadow
            receiveShadow
            geometry={nodes.pink_tulip.geometry}
            material={materials.pink_tulip}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="pink_wool002"
            castShadow
            receiveShadow
            geometry={nodes.pink_wool002.geometry}
            material={materials['pink_wool.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="piston_top_sticky"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Piston_Head006"
              castShadow
              receiveShadow
              geometry={nodes.Piston_Head006.geometry}
              material={materials.piston_top_sticky}
            />
            <mesh
              name="Piston_Head006_1"
              castShadow
              receiveShadow
              geometry={nodes.Piston_Head006_1.geometry}
              material={materials['piston_top.005']}
            />
            <mesh
              name="Piston_Head006_2"
              castShadow
              receiveShadow
              geometry={nodes.Piston_Head006_2.geometry}
              material={materials['piston_side.006']}
            />
          </group>
          <group
            name="pointed_dripstone_up_tip_merge"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Pointed_Dripstone002"
              castShadow
              receiveShadow
              geometry={nodes.Pointed_Dripstone002.geometry}
              material={materials.pointed_dripstone_up_tip_merge}
            />
            <mesh
              name="Pointed_Dripstone002_1"
              castShadow
              receiveShadow
              geometry={nodes.Pointed_Dripstone002_1.geometry}
              material={materials['pointed_dripstone_down_tip_merge.002']}
            />
            <mesh
              name="Pointed_Dripstone002_2"
              castShadow
              receiveShadow
              geometry={nodes.Pointed_Dripstone002_2.geometry}
              material={materials['pointed_dripstone_down_frustum.002']}
            />
          </group>
          <mesh
            name="polished_andesite019"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite019.geometry}
            material={materials['polished_andesite.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="polished_andesite020"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite020.geometry}
            material={materials['polished_andesite.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="polished_andesite021"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite021.geometry}
            material={materials['polished_andesite.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="polished_andesite022"
            castShadow
            receiveShadow
            geometry={nodes.polished_andesite022.geometry}
            material={materials['polished_andesite.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="polished_basalt_top"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Polished_Basalt"
              castShadow
              receiveShadow
              geometry={nodes.Polished_Basalt.geometry}
              material={materials.polished_basalt_top}
            />
            <mesh
              name="Polished_Basalt_1"
              castShadow
              receiveShadow
              geometry={nodes.Polished_Basalt_1.geometry}
              material={materials.polished_basalt_side}
            />
          </group>
          <mesh
            name="polished_blackstone"
            castShadow
            receiveShadow
            geometry={nodes.polished_blackstone.geometry}
            material={materials.polished_blackstone}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="polished_deepslate007"
            castShadow
            receiveShadow
            geometry={nodes.polished_deepslate007.geometry}
            material={materials['polished_deepslate.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="polished_deepslate008"
            castShadow
            receiveShadow
            geometry={nodes.polished_deepslate008.geometry}
            material={materials['polished_deepslate.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="polished_deepslate009"
            castShadow
            receiveShadow
            geometry={nodes.polished_deepslate009.geometry}
            material={materials['polished_deepslate.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="polished_deepslate010"
            castShadow
            receiveShadow
            geometry={nodes.polished_deepslate010.geometry}
            material={materials['polished_deepslate.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="polished_diorite006"
            castShadow
            receiveShadow
            geometry={nodes.polished_diorite006.geometry}
            material={materials['polished_diorite.003']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="polished_diorite007"
            castShadow
            receiveShadow
            geometry={nodes.polished_diorite007.geometry}
            material={materials['polished_diorite.003']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="polished_diorite008"
            castShadow
            receiveShadow
            geometry={nodes.polished_diorite008.geometry}
            material={materials['polished_diorite.003']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="polished_granite"
            castShadow
            receiveShadow
            geometry={nodes.polished_granite.geometry}
            material={materials.polished_granite}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="polished_granite001"
            castShadow
            receiveShadow
            geometry={nodes.polished_granite001.geometry}
            material={materials.polished_granite}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="prismarine"
            castShadow
            receiveShadow
            geometry={nodes.prismarine.geometry}
            material={materials.prismarine}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="prismarine001"
            castShadow
            receiveShadow
            geometry={nodes.prismarine001.geometry}
            material={materials.prismarine}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="prismarine002"
            castShadow
            receiveShadow
            geometry={nodes.prismarine002.geometry}
            material={materials.prismarine}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="prismarine_bricks001"
            castShadow
            receiveShadow
            geometry={nodes.prismarine_bricks001.geometry}
            material={materials['prismarine_bricks.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="prismarine_bricks002"
            castShadow
            receiveShadow
            geometry={nodes.prismarine_bricks002.geometry}
            material={materials['prismarine_bricks.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="pumpkin_stem008"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Pumpkin_Stem_age_7008"
              castShadow
              receiveShadow
              geometry={nodes.Pumpkin_Stem_age_7008.geometry}
              material={materials['pumpkin_stem.005']}
            />
            <mesh
              name="Pumpkin_Stem_age_7008_1"
              castShadow
              receiveShadow
              geometry={nodes.Pumpkin_Stem_age_7008_1.geometry}
              material={materials['attached_pumpkin_stem.005']}
            />
          </group>
          <group
            name="pumpkin_top003"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Skeleton_Skull001"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Skull001.geometry}
              material={materials['pumpkin_top.003']}
            />
            <mesh
              name="Skeleton_Skull001_1"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Skull001_1.geometry}
              material={materials['pumpkin_side.003']}
            />
            <mesh
              name="Skeleton_Skull001_2"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Skull001_2.geometry}
              material={materials['carved_pumpkin.003']}
            />
          </group>
          <group
            name="pumpkin_top004"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Skeleton_Wall_Skull002"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull002.geometry}
              material={materials['pumpkin_top.003']}
            />
            <mesh
              name="Skeleton_Wall_Skull002_1"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull002_1.geometry}
              material={materials['pumpkin_side.003']}
            />
            <mesh
              name="Skeleton_Wall_Skull002_2"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull002_2.geometry}
              material={materials['carved_pumpkin.003']}
            />
          </group>
          <mesh
            name="purple_concrete"
            castShadow
            receiveShadow
            geometry={nodes.purple_concrete.geometry}
            material={materials.purple_concrete}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="quartz_block_bottom011"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Double_Quartz_Slab"
              castShadow
              receiveShadow
              geometry={nodes.Double_Quartz_Slab.geometry}
              material={materials['quartz_block_bottom.005']}
            />
            <mesh
              name="Double_Quartz_Slab_1"
              castShadow
              receiveShadow
              geometry={nodes.Double_Quartz_Slab_1.geometry}
              material={materials['quartz_block_side.005']}
            />
            <mesh
              name="Double_Quartz_Slab_2"
              castShadow
              receiveShadow
              geometry={nodes.Double_Quartz_Slab_2.geometry}
              material={materials['quartz_block_top.005']}
            />
          </group>
          <group
            name="quartz_block_bottom012"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Quartz_Slab006"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab006.geometry}
              material={materials['quartz_block_bottom.005']}
            />
            <mesh
              name="Quartz_Slab006_1"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab006_1.geometry}
              material={materials['quartz_block_side.005']}
            />
            <mesh
              name="Quartz_Slab006_2"
              castShadow
              receiveShadow
              geometry={nodes.Quartz_Slab006_2.geometry}
              material={materials['quartz_block_top.005']}
            />
          </group>
          <mesh
            name="quartz_block_bottom013"
            castShadow
            receiveShadow
            geometry={nodes.quartz_block_bottom013.geometry}
            material={materials['quartz_block_bottom.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="quartz_block_side006"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Block_of_Quartz006"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz006.geometry}
              material={materials['quartz_block_side.005']}
            />
            <mesh
              name="Block_of_Quartz006_1"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz006_1.geometry}
              material={materials['quartz_block_top.005']}
            />
            <mesh
              name="Block_of_Quartz006_2"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Quartz006_2.geometry}
              material={materials['quartz_bricks.005']}
            />
          </group>
          <mesh
            name="quartz_block_top010"
            castShadow
            receiveShadow
            geometry={nodes.quartz_block_top010.geometry}
            material={materials['quartz_block_top.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="quartz_block_top011"
            castShadow
            receiveShadow
            geometry={nodes.quartz_block_top011.geometry}
            material={materials['quartz_block_top.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="rail005"
            castShadow
            receiveShadow
            geometry={nodes.rail005.geometry}
            material={materials['rail.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="raw_gold_block"
            castShadow
            receiveShadow
            geometry={nodes.raw_gold_block.geometry}
            material={materials.raw_gold_block}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="red_concrete001"
            castShadow
            receiveShadow
            geometry={nodes.red_concrete001.geometry}
            material={materials['red_concrete.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="red_concrete_powder002"
            castShadow
            receiveShadow
            geometry={nodes.red_concrete_powder002.geometry}
            material={materials['red_concrete_powder.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="red_nether_bricks"
            castShadow
            receiveShadow
            geometry={nodes.red_nether_bricks.geometry}
            material={materials.red_nether_bricks}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="red_nether_bricks001"
            castShadow
            receiveShadow
            geometry={nodes.red_nether_bricks001.geometry}
            material={materials.red_nether_bricks}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="red_sandstone001"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Red_Sandstone001"
              castShadow
              receiveShadow
              geometry={nodes.Red_Sandstone001.geometry}
              material={materials['red_sandstone.002']}
            />
            <mesh
              name="Red_Sandstone001_1"
              castShadow
              receiveShadow
              geometry={nodes.Red_Sandstone001_1.geometry}
              material={materials['red_sandstone_top.001']}
            />
          </group>
          <mesh
            name="red_terracotta003"
            castShadow
            receiveShadow
            geometry={nodes.red_terracotta003.geometry}
            material={materials['red_terracotta.003']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="red_wool"
            castShadow
            receiveShadow
            geometry={nodes.red_wool.geometry}
            material={materials.red_wool}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="red_wool001"
            castShadow
            receiveShadow
            geometry={nodes.red_wool001.geometry}
            material={materials.red_wool}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="redstone_torch_off005"
            castShadow
            receiveShadow
            geometry={nodes.redstone_torch_off005.geometry}
            material={materials['redstone_torch_off.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="repeater005"
            castShadow
            receiveShadow
            geometry={nodes.repeater005.geometry}
            material={materials['repeater.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="rooted_dirt006"
            castShadow
            receiveShadow
            geometry={nodes.rooted_dirt006.geometry}
            material={materials['rooted_dirt.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="sand006"
            castShadow
            receiveShadow
            geometry={nodes.sand006.geometry}
            material={materials['sand.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="sandstone004"
            castShadow
            receiveShadow
            geometry={nodes.sandstone004.geometry}
            material={materials['sandstone.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="sandstone_top009"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Cut_Sandstone001"
              castShadow
              receiveShadow
              geometry={nodes.Cut_Sandstone001.geometry}
              material={materials['sandstone_top.002']}
            />
            <mesh
              name="Cut_Sandstone001_1"
              castShadow
              receiveShadow
              geometry={nodes.Cut_Sandstone001_1.geometry}
              material={materials['cut_sandstone.001']}
            />
          </group>
          <group
            name="sandstone_top010"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Cut_Sandstone_Slab001"
              castShadow
              receiveShadow
              geometry={nodes.Cut_Sandstone_Slab001.geometry}
              material={materials['sandstone_top.002']}
            />
            <mesh
              name="Cut_Sandstone_Slab001_1"
              castShadow
              receiveShadow
              geometry={nodes.Cut_Sandstone_Slab001_1.geometry}
              material={materials['cut_sandstone.001']}
            />
          </group>
          <group
            name="sandstone_top011"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Sandstone004"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone004.geometry}
              material={materials['sandstone_top.002']}
            />
            <mesh
              name="Sandstone004_1"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone004_1.geometry}
              material={materials['sandstone.004']}
            />
            <mesh
              name="Sandstone004_2"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone004_2.geometry}
              material={materials['sandstone_bottom.004']}
            />
          </group>
          <group
            name="sandstone_top012"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Sandstone_Slab002"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone_Slab002.geometry}
              material={materials['sandstone_top.002']}
            />
            <mesh
              name="Sandstone_Slab002_1"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone_Slab002_1.geometry}
              material={materials['sandstone.004']}
            />
            <mesh
              name="Sandstone_Slab002_2"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone_Slab002_2.geometry}
              material={materials['sandstone_bottom.004']}
            />
          </group>
          <group
            name="sandstone_top013"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Sandstone_Stairs001"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone_Stairs001.geometry}
              material={materials['sandstone_top.002']}
            />
            <mesh
              name="Sandstone_Stairs001_1"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone_Stairs001_1.geometry}
              material={materials['sandstone.004']}
            />
            <mesh
              name="Sandstone_Stairs001_2"
              castShadow
              receiveShadow
              geometry={nodes.Sandstone_Stairs001_2.geometry}
              material={materials['sandstone_bottom.004']}
            />
          </group>
          <mesh
            name="sandstone_top014"
            castShadow
            receiveShadow
            geometry={nodes.sandstone_top014.geometry}
            material={materials['sandstone_top.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="sandstone_top015"
            castShadow
            receiveShadow
            geometry={nodes.sandstone_top015.geometry}
            material={materials['sandstone_top.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="scaffolding_top001"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Scaffolding002"
              castShadow
              receiveShadow
              geometry={nodes.Scaffolding002.geometry}
              material={materials['scaffolding_top.001']}
            />
            <mesh
              name="Scaffolding002_1"
              castShadow
              receiveShadow
              geometry={nodes.Scaffolding002_1.geometry}
              material={materials['scaffolding_side.002']}
            />
            <mesh
              name="Scaffolding002_2"
              castShadow
              receiveShadow
              geometry={nodes.Scaffolding002_2.geometry}
              material={materials['scaffolding_bottom.002']}
            />
          </group>
          <mesh
            name="sea_lantern"
            castShadow
            receiveShadow
            geometry={nodes.sea_lantern.geometry}
            material={materials.sea_lantern}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="smooth_stone007"
            castShadow
            receiveShadow
            geometry={nodes.smooth_stone007.geometry}
            material={materials['smooth_stone.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="smooth_stone008"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Stone_Slab004"
              castShadow
              receiveShadow
              geometry={nodes.Stone_Slab004.geometry}
              material={materials['smooth_stone.005']}
            />
            <mesh
              name="Stone_Slab004_1"
              castShadow
              receiveShadow
              geometry={nodes.Stone_Slab004_1.geometry}
              material={materials['smooth_stone_slab_side.001']}
            />
          </group>
          <mesh
            name="snow012"
            castShadow
            receiveShadow
            geometry={nodes.snow012.geometry}
            material={materials['snow.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="snow013"
            castShadow
            receiveShadow
            geometry={nodes.snow013.geometry}
            material={materials['snow.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="spruce_log"
            castShadow
            receiveShadow
            geometry={nodes.spruce_log.geometry}
            material={materials.spruce_log}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="spruce_planks006"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks006.geometry}
            material={materials['spruce_planks.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="spruce_planks007"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks007.geometry}
            material={materials['spruce_planks.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="spruce_planks008"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks008.geometry}
            material={materials['spruce_planks.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="spruce_planks009"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks009.geometry}
            material={materials['spruce_planks.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="spruce_planks010"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks010.geometry}
            material={materials['spruce_planks.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="spruce_planks011"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks011.geometry}
            material={materials['spruce_planks.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="spruce_planks012"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks012.geometry}
            material={materials['spruce_planks.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="spruce_trapdoor"
            castShadow
            receiveShadow
            geometry={nodes.spruce_trapdoor.geometry}
            material={materials.spruce_trapdoor}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="stone018"
            castShadow
            receiveShadow
            geometry={nodes.stone018.geometry}
            material={materials['stone.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="stone019"
            castShadow
            receiveShadow
            geometry={nodes.stone019.geometry}
            material={materials['stone.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="stone020"
            castShadow
            receiveShadow
            geometry={nodes.stone020.geometry}
            material={materials['stone.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="stone021"
            castShadow
            receiveShadow
            geometry={nodes.stone021.geometry}
            material={materials['stone.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="stone022"
            castShadow
            receiveShadow
            geometry={nodes.stone022.geometry}
            material={materials['stone.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="stone023"
            castShadow
            receiveShadow
            geometry={nodes.stone023.geometry}
            material={materials['stone.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="stone_bricks024"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks024.geometry}
            material={materials['stone_bricks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="stone_bricks025"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks025.geometry}
            material={materials['stone_bricks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="stone_bricks026"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks026.geometry}
            material={materials['stone_bricks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="stone_bricks027"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks027.geometry}
            material={materials['stone_bricks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="stone_bricks028"
            castShadow
            receiveShadow
            geometry={nodes.stone_bricks028.geometry}
            material={materials['stone_bricks.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="stonecutter_top"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Stone_Cutter"
              castShadow
              receiveShadow
              geometry={nodes.Stone_Cutter.geometry}
              material={materials.stonecutter_top}
            />
            <mesh
              name="Stone_Cutter_1"
              castShadow
              receiveShadow
              geometry={nodes.Stone_Cutter_1.geometry}
              material={materials.stonecutter_side}
            />
            <mesh
              name="Stone_Cutter_2"
              castShadow
              receiveShadow
              geometry={nodes.Stone_Cutter_2.geometry}
              material={materials.stonecutter_bottom}
            />
            <mesh
              name="Stone_Cutter_3"
              castShadow
              receiveShadow
              geometry={nodes.Stone_Cutter_3.geometry}
              material={materials.stonecutter_saw}
            />
          </group>
          <mesh
            name="stripped_acacia_log001"
            castShadow
            receiveShadow
            geometry={nodes.stripped_acacia_log001.geometry}
            material={materials['stripped_acacia_log.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="stripped_bamboo_block"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Block_of_Stripped_Bamboo"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Stripped_Bamboo.geometry}
              material={materials.stripped_bamboo_block}
            />
            <mesh
              name="Block_of_Stripped_Bamboo_1"
              castShadow
              receiveShadow
              geometry={nodes.Block_of_Stripped_Bamboo_1.geometry}
              material={materials.stripped_bamboo_block_top}
            />
          </group>
          <group
            name="stripped_birch_log004"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Stripped_Birch_Log002"
              castShadow
              receiveShadow
              geometry={nodes.Stripped_Birch_Log002.geometry}
              material={materials['stripped_birch_log.002']}
            />
            <mesh
              name="Stripped_Birch_Log002_1"
              castShadow
              receiveShadow
              geometry={nodes.Stripped_Birch_Log002_1.geometry}
              material={materials['stripped_birch_log_top.002']}
            />
          </group>
          <mesh
            name="stripped_birch_log005"
            castShadow
            receiveShadow
            geometry={nodes.stripped_birch_log005.geometry}
            material={materials['stripped_birch_log.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="stripped_mangrove_log002"
            castShadow
            receiveShadow
            geometry={nodes.stripped_mangrove_log002.geometry}
            material={materials['stripped_mangrove_log.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="stripped_mangrove_log_top"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Stripped_Mangrove_Log"
              castShadow
              receiveShadow
              geometry={nodes.Stripped_Mangrove_Log.geometry}
              material={materials.stripped_mangrove_log_top}
            />
            <mesh
              name="Stripped_Mangrove_Log_1"
              castShadow
              receiveShadow
              geometry={nodes.Stripped_Mangrove_Log_1.geometry}
              material={materials['stripped_mangrove_log.002']}
            />
          </group>
          <group
            name="stripped_oak_log003"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Stripped_Oak_Log"
              castShadow
              receiveShadow
              geometry={nodes.Stripped_Oak_Log.geometry}
              material={materials['stripped_oak_log.003']}
            />
            <mesh
              name="Stripped_Oak_Log_1"
              castShadow
              receiveShadow
              geometry={nodes.Stripped_Oak_Log_1.geometry}
              material={materials.stripped_oak_log_top}
            />
          </group>
          <mesh
            name="stripped_oak_log004"
            castShadow
            receiveShadow
            geometry={nodes.stripped_oak_log004.geometry}
            material={materials['stripped_oak_log.003']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="stripped_spruce_log005"
            castShadow
            receiveShadow
            geometry={nodes.stripped_spruce_log005.geometry}
            material={materials['stripped_spruce_log.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="stripped_warped_stem005"
            castShadow
            receiveShadow
            geometry={nodes.stripped_warped_stem005.geometry}
            material={materials['stripped_warped_stem.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="stripped_warped_stem_top"
            position={[105.804, -193.94, -429.059]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Stripped_Warped_Stem"
              castShadow
              receiveShadow
              geometry={nodes.Stripped_Warped_Stem.geometry}
              material={materials.stripped_warped_stem_top}
            />
            <mesh
              name="Stripped_Warped_Stem_1"
              castShadow
              receiveShadow
              geometry={nodes.Stripped_Warped_Stem_1.geometry}
              material={materials['stripped_warped_stem.004']}
            />
          </group>
          <mesh
            name="sweet_berry_bush_stage3"
            castShadow
            receiveShadow
            geometry={nodes.sweet_berry_bush_stage3.geometry}
            material={materials.sweet_berry_bush_stage3}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="torch"
            castShadow
            receiveShadow
            geometry={nodes.torch.geometry}
            material={materials.torch}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="torchflower002"
            castShadow
            receiveShadow
            geometry={nodes.torchflower002.geometry}
            material={materials['torchflower.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="tripwire_hook006"
            castShadow
            receiveShadow
            geometry={nodes.tripwire_hook006.geometry}
            material={materials['tripwire_hook.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="tuff006"
            castShadow
            receiveShadow
            geometry={nodes.tuff006.geometry}
            material={materials['tuff.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="warped_door_bottom"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="Warped_Door"
              castShadow
              receiveShadow
              geometry={nodes.Warped_Door.geometry}
              material={materials.warped_door_bottom}
            />
            <mesh
              name="Warped_Door_1"
              castShadow
              receiveShadow
              geometry={nodes.Warped_Door_1.geometry}
              material={materials.warped_door_top}
            />
          </group>
          <mesh
            name="warped_fungus004"
            castShadow
            receiveShadow
            geometry={nodes.warped_fungus004.geometry}
            material={materials['warped_fungus.004']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="warped_planks003"
            castShadow
            receiveShadow
            geometry={nodes.warped_planks003.geometry}
            material={materials['warped_planks.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="warped_planks004"
            castShadow
            receiveShadow
            geometry={nodes.warped_planks004.geometry}
            material={materials['warped_planks.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="warped_roots"
            castShadow
            receiveShadow
            geometry={nodes.warped_roots.geometry}
            material={materials.warped_roots}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="warped_trapdoor"
            castShadow
            receiveShadow
            geometry={nodes.warped_trapdoor.geometry}
            material={materials.warped_trapdoor}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="weathered_cut_copper001"
            castShadow
            receiveShadow
            geometry={nodes.weathered_cut_copper001.geometry}
            material={materials['weathered_cut_copper.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="weathered_cut_copper002"
            castShadow
            receiveShadow
            geometry={nodes.weathered_cut_copper002.geometry}
            material={materials['weathered_cut_copper.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="white_candle006"
            castShadow
            receiveShadow
            geometry={nodes.white_candle006.geometry}
            material={materials['white_candle.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="white_concrete_powder006"
            castShadow
            receiveShadow
            geometry={nodes.white_concrete_powder006.geometry}
            material={materials['white_concrete_powder.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <group
            name="white_shulker_box005"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="White_Shulker_Box006"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box006.geometry}
              material={materials['white_shulker_box.004']}
            />
            <mesh
              name="White_Shulker_Box006_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box006_1.geometry}
              material={materials['shulker_side_white.005']}
            />
            <mesh
              name="White_Shulker_Box006_2"
              castShadow
              receiveShadow
              geometry={nodes.White_Shulker_Box006_2.geometry}
              material={materials['shulker_bottom_white.005']}
            />
          </group>
          <group
            name="white_stained_glass007"
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}>
            <mesh
              name="White_Stained_Glass_Pane006"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane006.geometry}
              material={materials['white_stained_glass.005']}
            />
            <mesh
              name="White_Stained_Glass_Pane006_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane006_1.geometry}
              material={materials['white_stained_glass_pane_top.005']}
            />
          </group>
          <mesh
            name="white_tulip"
            castShadow
            receiveShadow
            geometry={nodes.white_tulip.geometry}
            material={materials.white_tulip}
            position={[105.804, -193.94, -429.059]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="white_wool010"
            castShadow
            receiveShadow
            geometry={nodes.white_wool010.geometry}
            material={materials['white_wool.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="white_wool011"
            castShadow
            receiveShadow
            geometry={nodes.white_wool011.geometry}
            material={materials['white_wool.005']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="wither_rose002"
            castShadow
            receiveShadow
            geometry={nodes.wither_rose002.geometry}
            material={materials['wither_rose.002']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="yellow_concrete001"
            castShadow
            receiveShadow
            geometry={nodes.yellow_concrete001.geometry}
            material={materials['yellow_concrete.001']}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="yellow_concrete_powder"
            castShadow
            receiveShadow
            geometry={nodes.yellow_concrete_powder.geometry}
            material={materials.yellow_concrete_powder}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
          <mesh
            name="yellow_wool"
            castShadow
            receiveShadow
            geometry={nodes.yellow_wool.geometry}
            material={materials.yellow_wool}
            position={[105.804, -193.94, -552.072]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={1.481}
          />
        </group>
        <group name="(2)_mcprep_empty009" position={[0, 191, -0.5]}>
          <group
            name="oak_door_top007"
            position={[82.872, -190.978, 410.017]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door007"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door007.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door007_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door007_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door007_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door007_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door007_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door007_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top009"
            position={[82.872, -190.978, 416.06]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door009"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door009.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door009_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door009_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door009_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door009_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door009_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door009_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top010"
            position={[82.872, -190.978, 519.962]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door077"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door077.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door077_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door077_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door077_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door077_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door077_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door077_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top011"
            position={[82.872, -190.978, 526.004]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door078"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door078.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door078_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door078_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door078_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door078_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door078_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door078_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top012"
            position={[82.872, -190.978, 365.509]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door012"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door012.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door012_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door012_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door012_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door012_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door012_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door012_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top013"
            position={[82.872, -190.978, 371.552]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door013"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door013.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door013_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door013_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door013_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door013_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door013_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door013_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top016"
            position={[82.872, -190.978, 312.547]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door016"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door016.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door016_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door016_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door016_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door016_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door016_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door016_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top017"
            position={[82.872, -190.978, 318.59]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door017"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door017.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door017_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door017_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door017_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door017_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door017_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door017_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top020"
            position={[82.872, -190.978, 264.981]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door020"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door020.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door020_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door020_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door020_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door020_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door020_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door020_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top021"
            position={[82.872, -190.978, 271.024]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door021"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door021.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door021_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door021_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door021_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door021_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door021_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door021_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top024"
            position={[82.872, -190.978, 217.15]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door024"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door024.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door024_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door024_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door024_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door024_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door024_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door024_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top025"
            position={[82.872, -190.978, 223.193]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door025"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door025.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door025_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door025_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door025_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door025_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door025_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door025_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top028"
            position={[82.872, -190.978, 172.077]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door028"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door028.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door028_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door028_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door028_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door028_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door028_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door028_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top029"
            position={[82.872, -190.978, 178.12]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door029"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door029.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door029_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door029_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door029_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door029_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door029_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door029_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top032"
            position={[82.872, -190.978, 125.98]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door032"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door032.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door032_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door032_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door032_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door032_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door032_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door032_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top033"
            position={[82.872, -190.978, 132.022]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door033"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door033.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door033_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door033_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door033_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door033_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door033_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door033_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top036"
            position={[82.872, -190.978, 78.403]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door036"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door036.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door036_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door036_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door036_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door036_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door036_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door036_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top037"
            position={[82.872, -190.978, 84.446]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door037"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door037.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door037_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door037_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door037_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door037_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door037_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door037_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top040"
            position={[82.872, -190.978, 28.424]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door040"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door040.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door040_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door040_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door040_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door040_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door040_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door040_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top041"
            position={[82.872, -190.978, 34.466]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door041"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door041.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door041_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door041_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door041_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door041_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door041_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door041_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top064"
            position={[82.872, -190.978, 577.067]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door065"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door065.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door065_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door065_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door065_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door065_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door065_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door065_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top065"
            position={[82.872, -190.978, 583.109]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door066"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door066.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door066_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door066_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door066_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door066_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door066_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door066_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top072"
            position={[82.872, -190.978, 470.271]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door073"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door073.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door073_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door073_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door073_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door073_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door073_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door073_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
          <group
            name="oak_door_top073"
            position={[82.872, -190.978, 476.313]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.993, 2.446, 1.379]}>
            <mesh
              name="Oak_Door074"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door074.geometry}
              material={materials['oak_door_top.006']}
            />
            <mesh
              name="Oak_Door074_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door074_1.geometry}
              material={materials['oak_door_bottom.006']}
            />
            <mesh
              name="Oak_Door074_2"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door074_2.geometry}
              material={materials['oak_planks.007']}
            />
            <mesh
              name="Oak_Door074_3"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Door074_3.geometry}
              material={materials['tripwire_hook.006']}
            />
          </group>
        </group>
        <group name="(2)_mcprep_empty010" />
        <group name="(2)_mcprep_empty011" />
        <group name="(2)_mcprep_empty012" position={[0, 191, 0]}>
          <mesh
            name="acacia_leaves"
            castShadow
            receiveShadow
            geometry={nodes.acacia_leaves.geometry}
            material={materials.acacia_leaves}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <group
            name="acacia_log008"
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}>
            <mesh
              name="Acacia_Log"
              castShadow
              receiveShadow
              geometry={nodes.Acacia_Log.geometry}
              material={materials['acacia_log.007']}
            />
            <mesh
              name="Acacia_Log_1"
              castShadow
              receiveShadow
              geometry={nodes.Acacia_Log_1.geometry}
              material={materials.acacia_log_top}
            />
          </group>
          <mesh
            name="acacia_sapling001"
            castShadow
            receiveShadow
            geometry={nodes.acacia_sapling001.geometry}
            material={materials['acacia_sapling.002']}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="allium001"
            castShadow
            receiveShadow
            geometry={nodes.allium001.geometry}
            material={materials['allium.002']}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="azure_bluet001"
            castShadow
            receiveShadow
            geometry={nodes.azure_bluet001.geometry}
            material={materials['azure_bluet.002']}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="birch_planks028"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks028.geometry}
            material={materials['birch_planks.008']}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="blue_orchid"
            castShadow
            receiveShadow
            geometry={nodes.blue_orchid.geometry}
            material={materials.blue_orchid}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="brown_mushroom008"
            castShadow
            receiveShadow
            geometry={nodes.brown_mushroom008.geometry}
            material={materials['brown_mushroom.007']}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <group
            name="cactus_top"
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}>
            <mesh
              name="Cactus"
              castShadow
              receiveShadow
              geometry={nodes.Cactus.geometry}
              material={materials.cactus_top}
            />
            <mesh
              name="Cactus_1"
              castShadow
              receiveShadow
              geometry={nodes.Cactus_1.geometry}
              material={materials.cactus_side}
            />
            <mesh
              name="Cactus_2"
              castShadow
              receiveShadow
              geometry={nodes.Cactus_2.geometry}
              material={materials.cactus_bottom}
            />
          </group>
          <mesh
            name="chorus_plant"
            castShadow
            receiveShadow
            geometry={nodes.chorus_plant.geometry}
            material={materials.chorus_plant}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="dandelion001"
            castShadow
            receiveShadow
            geometry={nodes.dandelion001.geometry}
            material={materials['dandelion.002']}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="dark_oak_leaves"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_leaves.geometry}
            material={materials.dark_oak_leaves}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <group
            name="dark_oak_log008"
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}>
            <mesh
              name="Dark_Oak_Log"
              castShadow
              receiveShadow
              geometry={nodes.Dark_Oak_Log.geometry}
              material={materials['dark_oak_log.007']}
            />
            <mesh
              name="Dark_Oak_Log_1"
              castShadow
              receiveShadow
              geometry={nodes.Dark_Oak_Log_1.geometry}
              material={materials.dark_oak_log_top}
            />
          </group>
          <mesh
            name="dark_oak_sapling"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_sapling.geometry}
            material={materials.dark_oak_sapling}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <group
            name="daylight_detector_side001"
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}>
            <mesh
              name="Inverted_Daylight_Sensor"
              castShadow
              receiveShadow
              geometry={nodes.Inverted_Daylight_Sensor.geometry}
              material={materials['daylight_detector_side.001']}
            />
            <mesh
              name="Inverted_Daylight_Sensor_1"
              castShadow
              receiveShadow
              geometry={nodes.Inverted_Daylight_Sensor_1.geometry}
              material={materials.daylight_detector_inverted_top}
            />
          </group>
          <mesh
            name="dead_bush002"
            castShadow
            receiveShadow
            geometry={nodes.dead_bush002.geometry}
            material={materials['dead_bush.003']}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="dirt014"
            castShadow
            receiveShadow
            geometry={nodes.dirt014.geometry}
            material={materials['dirt.007']}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <group
            name="dirt015"
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}>
            <mesh
              name="Flower_Pot006"
              castShadow
              receiveShadow
              geometry={nodes.Flower_Pot006.geometry}
              material={materials['dirt.007']}
            />
            <mesh
              name="Flower_Pot006_1"
              castShadow
              receiveShadow
              geometry={nodes.Flower_Pot006_1.geometry}
              material={materials['flower_pot.005']}
            />
          </group>
          <mesh
            name="fern002"
            castShadow
            receiveShadow
            geometry={nodes.fern002.geometry}
            material={materials['fern.002']}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="grass"
            castShadow
            receiveShadow
            geometry={nodes.grass.geometry}
            material={materials.grass}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <group
            name="green_stained_glass"
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}>
            <mesh
              name="Green_Stained_Glass_Pane"
              castShadow
              receiveShadow
              geometry={nodes.Green_Stained_Glass_Pane.geometry}
              material={materials.green_stained_glass}
            />
            <mesh
              name="Green_Stained_Glass_Pane_1"
              castShadow
              receiveShadow
              geometry={nodes.Green_Stained_Glass_Pane_1.geometry}
              material={materials.green_stained_glass_pane_top}
            />
          </group>
          <mesh
            name="jungle_leaves"
            castShadow
            receiveShadow
            geometry={nodes.jungle_leaves.geometry}
            material={materials.jungle_leaves}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <group
            name="jungle_log"
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}>
            <mesh
              name="Jungle_Log"
              castShadow
              receiveShadow
              geometry={nodes.Jungle_Log.geometry}
              material={materials.jungle_log}
            />
            <mesh
              name="Jungle_Log_1"
              castShadow
              receiveShadow
              geometry={nodes.Jungle_Log_1.geometry}
              material={materials.jungle_log_top}
            />
          </group>
          <mesh
            name="jungle_planks003"
            castShadow
            receiveShadow
            geometry={nodes.jungle_planks003.geometry}
            material={materials['jungle_planks.003']}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="jungle_sapling"
            castShadow
            receiveShadow
            geometry={nodes.jungle_sapling.geometry}
            material={materials.jungle_sapling}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="large_fern_bottom001"
            castShadow
            receiveShadow
            geometry={nodes.large_fern_bottom001.geometry}
            material={materials['large_fern_bottom.001']}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="lilac_bottom001"
            castShadow
            receiveShadow
            geometry={nodes.lilac_bottom001.geometry}
            material={materials['lilac_bottom.002']}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="lily_pad"
            castShadow
            receiveShadow
            geometry={nodes.lily_pad.geometry}
            material={materials.lily_pad}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="oak_leaves"
            castShadow
            receiveShadow
            geometry={nodes.oak_leaves.geometry}
            material={materials.oak_leaves}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="oak_planks042"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks042.geometry}
            material={materials['oak_planks.009']}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="oak_planks044"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks044.geometry}
            material={materials['oak_planks.009']}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="oak_planks045"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks045.geometry}
            material={materials['oak_planks.009']}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <group
            name="piston_top007"
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}>
            <mesh
              name="Piston_Head009"
              castShadow
              receiveShadow
              geometry={nodes.Piston_Head009.geometry}
              material={materials['piston_top.007']}
            />
            <mesh
              name="Piston_Head009_1"
              castShadow
              receiveShadow
              geometry={nodes.Piston_Head009_1.geometry}
              material={materials['piston_side.008']}
            />
          </group>
          <mesh
            name="poppy"
            castShadow
            receiveShadow
            geometry={nodes.poppy.geometry}
            material={materials.poppy}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="poppy001"
            castShadow
            receiveShadow
            geometry={nodes.poppy001.geometry}
            material={materials.poppy}
            position={[118.882, -192.139, 465.337]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[2.9, 2.907, 2.085]}
          />
          <mesh
            name="red_tulip"
            castShadow
            receiveShadow
            geometry={nodes.red_tulip.geometry}
            material={materials.red_tulip}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <group
            name="rose_bush_bottom"
            position={[-507.895, -191, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="rose_bush_bottom001"
            castShadow
            receiveShadow
            geometry={nodes.rose_bush_bottom001.geometry}
            material={materials.rose_bush_bottom}
            position={[118.882, -192.139, 465.337]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[2.9, 2.907, 2.085]}
          />
          <mesh
            name="spruce_leaves"
            castShadow
            receiveShadow
            geometry={nodes.spruce_leaves.geometry}
            material={materials.spruce_leaves}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="spruce_planks014"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks014.geometry}
            material={materials['spruce_planks.007']}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="spruce_planks015"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks015.geometry}
            material={materials['spruce_planks.007']}
            position={[118.882, -192.139, 465.337]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[2.9, 2.907, 2.085]}
          />
          <mesh
            name="sunflower_bottom"
            castShadow
            receiveShadow
            geometry={nodes.sunflower_bottom.geometry}
            material={materials.sunflower_bottom}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="tall_grass_bottom002"
            castShadow
            receiveShadow
            geometry={nodes.tall_grass_bottom002.geometry}
            material={materials['tall_grass_bottom.002']}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <mesh
            name="tall_grass_bottom003"
            castShadow
            receiveShadow
            geometry={nodes.tall_grass_bottom003.geometry}
            material={materials['tall_grass_bottom.002']}
            position={[118.882, -192.139, 465.337]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[2.9, 2.907, 2.085]}
          />
          <mesh
            name="yellow_stained_glass"
            castShadow
            receiveShadow
            geometry={nodes.yellow_stained_glass.geometry}
            material={materials['yellow_stained_glass.001']}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
          <group
            name="yellow_stained_glass001"
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}>
            <mesh
              name="Yellow_Stained_Glass_Pane002"
              castShadow
              receiveShadow
              geometry={nodes.Yellow_Stained_Glass_Pane002.geometry}
              material={materials['yellow_stained_glass.001']}
            />
            <mesh
              name="Yellow_Stained_Glass_Pane002_1"
              castShadow
              receiveShadow
              geometry={nodes.Yellow_Stained_Glass_Pane002_1.geometry}
              material={materials['yellow_stained_glass_pane_top.001']}
            />
          </group>
          <mesh
            name="yellow_wool001"
            castShadow
            receiveShadow
            geometry={nodes.yellow_wool001.geometry}
            material={materials['yellow_wool.002']}
            position={[-181.513, -16.791, 889.013]}
            rotation={[Math.PI / 2, -Math.PI / 2, 0]}
            scale={0.35}
          />
        </group>
        <group name="(2)_mcprep_empty013" position={[0, 191.5, -0.5]}>
          <mesh
            name="acacia_leaves001"
            castShadow
            receiveShadow
            geometry={nodes.acacia_leaves001.geometry}
            material={materials['acacia_leaves.001']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="acacia_log009"
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Acacia_Log001"
              castShadow
              receiveShadow
              geometry={nodes.Acacia_Log001.geometry}
              material={materials['acacia_log.008']}
            />
            <mesh
              name="Acacia_Log001_1"
              castShadow
              receiveShadow
              geometry={nodes.Acacia_Log001_1.geometry}
              material={materials['acacia_log_top.001']}
            />
          </group>
          <mesh
            name="acacia_log010"
            castShadow
            receiveShadow
            geometry={nodes.acacia_log010.geometry}
            material={materials['acacia_log.008']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="acacia_sapling002"
            castShadow
            receiveShadow
            geometry={nodes.acacia_sapling002.geometry}
            material={materials['acacia_sapling.003']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="allium002"
            castShadow
            receiveShadow
            geometry={nodes.allium002.geometry}
            material={materials['allium.003']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group name="allium003" position={[-729.323, -191.5, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Sunflower__7"
              castShadow
              receiveShadow
              geometry={nodes.Sunflower__7.geometry}
              material={materials['allium.003']}
            />
            <mesh
              name="Sunflower__7_1"
              castShadow
              receiveShadow
              geometry={nodes.Sunflower__7_1.geometry}
              material={materials.spruce_door_top}
            />
          </group>
          <mesh
            name="andesite038"
            castShadow
            receiveShadow
            geometry={nodes.andesite038.geometry}
            material={materials['andesite.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="andesite039"
            castShadow
            receiveShadow
            geometry={nodes.andesite039.geometry}
            material={materials['andesite.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="andesite040"
            castShadow
            receiveShadow
            geometry={nodes.andesite040.geometry}
            material={materials['andesite.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="andesite041"
            castShadow
            receiveShadow
            geometry={nodes.andesite041.geometry}
            material={materials['andesite.007']}
            position={[62.565, -179.829, 481.95]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.745}
          />
          <mesh
            name="andesite043"
            castShadow
            receiveShadow
            geometry={nodes.andesite043.geometry}
            material={materials['andesite.007']}
            position={[59.299, -183.483, 169.558]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.983}
          />
          <mesh
            name="andesite044"
            castShadow
            receiveShadow
            geometry={nodes.andesite044.geometry}
            material={materials['andesite.007']}
            position={[75.608, -184.576, 562.525]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}
          />
          <group
            name="azalea_top001"
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Azalea001"
              castShadow
              receiveShadow
              geometry={nodes.Azalea001.geometry}
              material={materials['azalea_top.001']}
            />
            <mesh
              name="Azalea001_1"
              castShadow
              receiveShadow
              geometry={nodes.Azalea001_1.geometry}
              material={materials['azalea_side.001']}
            />
            <mesh
              name="Azalea001_2"
              castShadow
              receiveShadow
              geometry={nodes.Azalea001_2.geometry}
              material={materials['azalea_plant.001']}
            />
          </group>
          <group
            name="big_dripleaf_top001"
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Big_Dripleaf001"
              castShadow
              receiveShadow
              geometry={nodes.Big_Dripleaf001.geometry}
              material={materials['big_dripleaf_top.001']}
            />
            <mesh
              name="Big_Dripleaf001_1"
              castShadow
              receiveShadow
              geometry={nodes.Big_Dripleaf001_1.geometry}
              material={materials['big_dripleaf_side.001']}
            />
            <mesh
              name="Big_Dripleaf001_2"
              castShadow
              receiveShadow
              geometry={nodes.Big_Dripleaf001_2.geometry}
              material={materials['big_dripleaf_tip.001']}
            />
            <mesh
              name="Big_Dripleaf001_3"
              castShadow
              receiveShadow
              geometry={nodes.Big_Dripleaf001_3.geometry}
              material={materials['big_dripleaf_stem.001']}
            />
          </group>
          <mesh
            name="birch_planks029"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks029.geometry}
            material={materials['birch_planks.009']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="birch_planks030"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks030.geometry}
            material={materials['birch_planks.009']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="birch_planks031"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks031.geometry}
            material={materials['birch_planks.009']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="birch_planks032"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks032.geometry}
            material={materials['birch_planks.009']}
            position={[62.855, -160.638, 482.546]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.745}
          />
          <mesh
            name="birch_planks033"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks033.geometry}
            material={materials['birch_planks.009']}
            position={[63.567, -161.743, 483.108]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.745}
          />
          <mesh
            name="birch_planks034"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks034.geometry}
            material={materials['birch_planks.009']}
            position={[63.802, -175.887, 489.003]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.745}
          />
          <mesh
            name="birch_planks037"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks037.geometry}
            material={materials['birch_planks.009']}
            position={[62.12, -181.379, 417.043]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}
          />
          <mesh
            name="birch_planks038"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks038.geometry}
            material={materials['birch_planks.009']}
            position={[59.628, -161.674, 170.235]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.983}
          />
          <mesh
            name="birch_planks039"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks039.geometry}
            material={materials['birch_planks.009']}
            position={[60.437, -162.929, 170.874]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.983}
          />
          <mesh
            name="birch_planks040"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks040.geometry}
            material={materials['birch_planks.009']}
            position={[52.339, -181.379, 176.356]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}
          />
          <mesh
            name="birch_planks041"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks041.geometry}
            material={materials['birch_planks.009']}
            position={[75.843, -169.011, 563.008]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}
          />
          <mesh
            name="birch_planks042"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks042.geometry}
            material={materials['birch_planks.009']}
            position={[76.42, -169.908, 563.464]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}
          />
          <mesh
            name="birch_planks043"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks043.geometry}
            material={materials['birch_planks.009']}
            position={[76.611, -181.379, 568.245]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}
          />
          <mesh
            name="birch_trapdoor003"
            castShadow
            receiveShadow
            geometry={nodes.birch_trapdoor003.geometry}
            material={materials['birch_trapdoor.004']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="birch_trapdoor004"
            castShadow
            receiveShadow
            geometry={nodes.birch_trapdoor004.geometry}
            material={materials['birch_trapdoor.004']}
            position={[63.802, -175.287, 489.003]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.745}
          />
          <mesh
            name="birch_trapdoor005"
            castShadow
            receiveShadow
            geometry={nodes.birch_trapdoor005.geometry}
            material={materials['birch_trapdoor.004']}
            position={[62.12, -180.893, 417.043]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}
          />
          <mesh
            name="birch_trapdoor006"
            castShadow
            receiveShadow
            geometry={nodes.birch_trapdoor006.geometry}
            material={materials['birch_trapdoor.004']}
            position={[52.339, -180.893, 176.356]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}
          />
          <mesh
            name="birch_trapdoor007"
            castShadow
            receiveShadow
            geometry={nodes.birch_trapdoor007.geometry}
            material={materials['birch_trapdoor.004']}
            position={[76.611, -180.893, 568.245]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}
          />
          <mesh
            name="chain008"
            castShadow
            receiveShadow
            geometry={nodes.chain008.geometry}
            material={materials['chain.008']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="cobbled_deepslate027"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate027.geometry}
            material={materials['cobbled_deepslate.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="cobbled_deepslate028"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate028.geometry}
            material={materials['cobbled_deepslate.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="cobbled_deepslate029"
            castShadow
            receiveShadow
            geometry={nodes.cobbled_deepslate029.geometry}
            material={materials['cobbled_deepslate.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="cobblestone029"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone029.geometry}
            material={materials['cobblestone.008']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="cobweb"
            castShadow
            receiveShadow
            geometry={nodes.cobweb.geometry}
            material={materials.cobweb}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="cobweb001"
            castShadow
            receiveShadow
            geometry={nodes.cobweb001.geometry}
            material={materials.cobweb}
            position={[61.876, -157.969, 482.955]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.745}
          />
          <mesh
            name="cobweb003"
            castShadow
            receiveShadow
            geometry={nodes.cobweb003.geometry}
            material={materials.cobweb}
            position={[58.515, -158.641, 170.701]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.983}
          />
          <mesh
            name="cobweb004"
            castShadow
            receiveShadow
            geometry={nodes.cobweb004.geometry}
            material={materials.cobweb}
            position={[75.049, -166.847, 563.34]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}
          />
          <mesh
            name="crimson_fungus"
            castShadow
            receiveShadow
            geometry={nodes.crimson_fungus.geometry}
            material={materials.crimson_fungus}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="crimson_fungus001"
            castShadow
            receiveShadow
            geometry={nodes.crimson_fungus001.geometry}
            material={materials.crimson_fungus}
            position={[61.556, -158.281, 334.652]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={2.108}
          />
          <mesh
            name="crimson_fungus002"
            castShadow
            receiveShadow
            geometry={nodes.crimson_fungus002.geometry}
            material={materials.crimson_fungus}
            position={[60.823, -158.281, 338.737]}
            rotation={[Math.PI / 2, 0, 1.955]}
            scale={2.108}
          />
          <mesh
            name="crimson_fungus003"
            castShadow
            receiveShadow
            geometry={nodes.crimson_fungus003.geometry}
            material={materials.crimson_fungus}
            position={[230.457, -197.227, -76.018]}
            rotation={[Math.PI / 2, 0, 0.085]}
            scale={[1.628, 1.147, 1.129]}
          />
          <mesh
            name="crimson_fungus004"
            castShadow
            receiveShadow
            geometry={nodes.crimson_fungus004.geometry}
            material={materials.crimson_fungus}
            position={[-4.451, -197.227, 80.073]}
            rotation={[Math.PI / 2, 0, -3.108]}
            scale={[1.635, 1.139, 1.129]}
          />
          <mesh
            name="crimson_roots"
            castShadow
            receiveShadow
            geometry={nodes.crimson_roots.geometry}
            material={materials.crimson_roots}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="crimson_roots001"
            castShadow
            receiveShadow
            geometry={nodes.crimson_roots001.geometry}
            material={materials.crimson_roots}
            position={[60.089, -158.819, 337.138]}
            rotation={[Math.PI / 2, 0, 1.955]}
            scale={2.108}
          />
          <mesh
            name="crimson_roots002"
            castShadow
            receiveShadow
            geometry={nodes.crimson_roots002.geometry}
            material={materials.crimson_roots}
            position={[60.349, -158.819, 335.932]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={2.108}
          />
          <mesh
            name="crimson_roots003"
            castShadow
            receiveShadow
            geometry={nodes.crimson_roots003.geometry}
            material={materials.crimson_roots}
            position={[230.457, -197.227, -76.018]}
            rotation={[Math.PI / 2, 0, 0.085]}
            scale={[1.628, 1.147, 1.129]}
          />
          <mesh
            name="crimson_roots004"
            castShadow
            receiveShadow
            geometry={nodes.crimson_roots004.geometry}
            material={materials.crimson_roots}
            position={[-4.451, -197.227, 80.073]}
            rotation={[Math.PI / 2, 0, -3.108]}
            scale={[1.635, 1.139, 1.129]}
          />
          <mesh
            name="dandelion002"
            castShadow
            receiveShadow
            geometry={nodes.dandelion002.geometry}
            material={materials['dandelion.003']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dandelion003"
            castShadow
            receiveShadow
            geometry={nodes.dandelion003.geometry}
            material={materials['dandelion.003']}
            position={[63.16, -165.043, 23.671]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.906}
          />
          <mesh
            name="dandelion004"
            castShadow
            receiveShadow
            geometry={nodes.dandelion004.geometry}
            material={materials['dandelion.003']}
            position={[63.664, -163.745, 24.787]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.097}
          />
          <mesh
            name="dandelion005"
            castShadow
            receiveShadow
            geometry={nodes.dandelion005.geometry}
            material={materials['dandelion.003']}
            position={[63.365, -164.514, 24.125]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.577}
          />
          <mesh
            name="dandelion006"
            castShadow
            receiveShadow
            geometry={nodes.dandelion006.geometry}
            material={materials['dandelion.003']}
            position={[63.73, -163.577, 24.931]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={0.992}
          />
          <mesh
            name="dark_oak_log009"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_log009.geometry}
            material={materials['dark_oak_log.008']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dark_oak_planks012"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks012.geometry}
            material={materials['dark_oak_planks.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dark_oak_planks013"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks013.geometry}
            material={materials['dark_oak_planks.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dark_oak_planks014"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks014.geometry}
            material={materials['dark_oak_planks.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="dark_oak_sapling001"
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Pitcher_Plant"
              castShadow
              receiveShadow
              geometry={nodes.Pitcher_Plant.geometry}
              material={materials['dark_oak_sapling.001']}
            />
            <mesh
              name="Pitcher_Plant_1"
              castShadow
              receiveShadow
              geometry={nodes.Pitcher_Plant_1.geometry}
              material={materials['dark_oak_log_top.001']}
            />
            <mesh
              name="Pitcher_Plant_2"
              castShadow
              receiveShadow
              geometry={nodes.Pitcher_Plant_2.geometry}
              material={materials['black_stained_glass.003']}
            />
            <mesh
              name="Pitcher_Plant_3"
              castShadow
              receiveShadow
              geometry={nodes.Pitcher_Plant_3.geometry}
              material={materials['black_stained_glass_pane_top.003']}
            />
            <mesh
              name="Pitcher_Plant_4"
              castShadow
              receiveShadow
              geometry={nodes.Pitcher_Plant_4.geometry}
              material={materials.wet_sponge}
            />
            <mesh
              name="Pitcher_Plant_5"
              castShadow
              receiveShadow
              geometry={nodes.Pitcher_Plant_5.geometry}
              material={materials.chorus_flower_dead}
            />
          </group>
          <mesh
            name="dark_oak_trapdoor001"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_trapdoor001.geometry}
            material={materials['dark_oak_trapdoor.003']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dead_fire_coral005"
            castShadow
            receiveShadow
            geometry={nodes.dead_fire_coral005.geometry}
            material={materials['dead_fire_coral.006']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dead_fire_coral006"
            castShadow
            receiveShadow
            geometry={nodes.dead_fire_coral006.geometry}
            material={materials['dead_fire_coral.006']}
            position={[58.772, -162.173, 333.354]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={2.108}
          />
          <mesh
            name="dead_fire_coral007"
            castShadow
            receiveShadow
            geometry={nodes.dead_fire_coral007.geometry}
            material={materials['dead_fire_coral.006']}
            position={[63.07, -162.173, 336.643]}
            rotation={[Math.PI / 2, 0, 1.955]}
            scale={2.108}
          />
          <mesh
            name="dead_fire_coral009"
            castShadow
            receiveShadow
            geometry={nodes.dead_fire_coral009.geometry}
            material={materials['dead_fire_coral.006']}
            position={[230.457, -197.227, -76.018]}
            rotation={[Math.PI / 2, 0, 0.085]}
            scale={[1.628, 1.147, 1.129]}
          />
          <mesh
            name="dead_fire_coral010"
            castShadow
            receiveShadow
            geometry={nodes.dead_fire_coral010.geometry}
            material={materials['dead_fire_coral.006']}
            position={[-4.451, -197.227, 80.073]}
            rotation={[Math.PI / 2, 0, -3.108]}
            scale={[1.635, 1.139, 1.129]}
          />
          <mesh
            name="dead_horn_coral007"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral007.geometry}
            material={materials['dead_horn_coral.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dead_horn_coral008"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral008.geometry}
            material={materials['dead_horn_coral.007']}
            position={[64.347, -161.124, 337.45]}
            rotation={[Math.PI / 2, 0, 1.965]}
            scale={1.582}
          />
          <mesh
            name="dead_horn_coral009"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral009.geometry}
            material={materials['dead_horn_coral.007']}
            position={[64.347, -157.424, 22.696]}
            rotation={[Math.PI / 2, 0, 0.475]}
            scale={1.582}
          />
          <mesh
            name="dead_horn_coral010"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral010.geometry}
            material={materials['dead_horn_coral.007']}
            position={[64.347, -161.124, 31.262]}
            rotation={[Math.PI / 2, 0, 1.965]}
            scale={1.582}
          />
          <mesh
            name="dead_horn_coral011"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral011.geometry}
            material={materials['dead_horn_coral.007']}
            position={[68.135, -160.197, 28.045]}
            rotation={[Math.PI / 2, 0, 1.148]}
            scale={1.582}
          />
          <mesh
            name="dead_horn_coral012"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral012.geometry}
            material={materials['dead_horn_coral.007']}
            position={[59.032, -160.197, 28.045]}
            rotation={[Math.PI / 2, 0, 1.904]}
            scale={1.582}
          />
          <mesh
            name="dead_horn_coral013"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral013.geometry}
            material={materials['dead_horn_coral.007']}
            position={[64.43, -160.197, 28.045]}
            rotation={[Math.PI / 2, 0, 1.683]}
            scale={1.582}
          />
          <mesh
            name="dead_horn_coral015"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral015.geometry}
            material={materials['dead_horn_coral.007']}
            position={[64.347, -157.424, 337.45]}
            rotation={[Math.PI / 2, 0, 1.148]}
            scale={1.582}
          />
          <mesh
            name="dead_horn_coral_fan016"
            castShadow
            receiveShadow
            geometry={nodes.dead_horn_coral_fan016.geometry}
            material={materials['dead_horn_coral_fan.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dead_tube_coral_fan015"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral_fan015.geometry}
            material={materials['dead_tube_coral_fan.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="deepslate_top"
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Deepslate012"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate012.geometry}
              material={materials['deepslate_top.009']}
            />
            <mesh
              name="Deepslate012_1"
              castShadow
              receiveShadow
              geometry={nodes.Deepslate012_1.geometry}
              material={materials['deepslate.009']}
            />
          </group>
          <mesh
            name="diorite036"
            castShadow
            receiveShadow
            geometry={nodes.diorite036.geometry}
            material={materials['diorite.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="diorite037"
            castShadow
            receiveShadow
            geometry={nodes.diorite037.geometry}
            material={materials['diorite.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="diorite038"
            castShadow
            receiveShadow
            geometry={nodes.diorite038.geometry}
            material={materials['diorite.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="diorite039"
            castShadow
            receiveShadow
            geometry={nodes.diorite039.geometry}
            material={materials['diorite.007']}
            position={[62.262, -178.075, 481.779]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.745}
          />
          <mesh
            name="diorite041"
            castShadow
            receiveShadow
            geometry={nodes.diorite041.geometry}
            material={materials['diorite.007']}
            position={[58.954, -181.49, 169.363]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.983}
          />
          <mesh
            name="diorite042"
            castShadow
            receiveShadow
            geometry={nodes.diorite042.geometry}
            material={materials['diorite.007']}
            position={[75.362, -183.154, 562.386]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}
          />
          <mesh
            name="dirt016"
            castShadow
            receiveShadow
            geometry={nodes.dirt016.geometry}
            material={materials['dirt.008']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dripstone_block"
            castShadow
            receiveShadow
            geometry={nodes.dripstone_block.geometry}
            material={materials.dripstone_block}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="fern003"
            castShadow
            receiveShadow
            geometry={nodes.fern003.geometry}
            material={materials['fern.003']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="granite015"
            castShadow
            receiveShadow
            geometry={nodes.granite015.geometry}
            material={materials['granite.009']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="granite035"
            castShadow
            receiveShadow
            geometry={nodes.granite035.geometry}
            material={materials['granite.009']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="granite036"
            castShadow
            receiveShadow
            geometry={nodes.granite036.geometry}
            material={materials['granite.009']}
            position={[57.539, -174.392, 335.557]}
            rotation={[Math.PI / 2, 0, 1.955]}
            scale={2.108}
          />
          <mesh
            name="granite037"
            castShadow
            receiveShadow
            geometry={nodes.granite037.geometry}
            material={materials['granite.009']}
            position={[59.84, -174.392, 338.889]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={2.108}
          />
          <mesh
            name="granite038"
            castShadow
            receiveShadow
            geometry={nodes.granite038.geometry}
            material={materials['granite.009']}
            position={[65.036, -176.557, 26.984]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.906}
          />
          <mesh
            name="granite039"
            castShadow
            receiveShadow
            geometry={nodes.granite039.geometry}
            material={materials['granite.009']}
            position={[230.457, -197.227, -76.018]}
            rotation={[Math.PI / 2, 0, 0.085]}
            scale={[1.628, 1.147, 1.129]}
          />
          <mesh
            name="granite040"
            castShadow
            receiveShadow
            geometry={nodes.granite040.geometry}
            material={materials['granite.009']}
            position={[230.457, -197.227, -76.018]}
            rotation={[Math.PI / 2, 0, 0.085]}
            scale={[1.628, 1.147, 1.129]}
          />
          <mesh
            name="granite041"
            castShadow
            receiveShadow
            geometry={nodes.granite041.geometry}
            material={materials['granite.009']}
            position={[-4.451, -197.227, 80.073]}
            rotation={[Math.PI / 2, 0, -3.108]}
            scale={[1.635, 1.139, 1.129]}
          />
          <mesh
            name="granite042"
            castShadow
            receiveShadow
            geometry={nodes.granite042.geometry}
            material={materials['granite.009']}
            position={[-4.451, -197.227, 80.073]}
            rotation={[Math.PI / 2, 0, -3.108]}
            scale={[1.635, 1.139, 1.129]}
          />
          <mesh
            name="grass001"
            castShadow
            receiveShadow
            geometry={nodes.grass001.geometry}
            material={materials['grass.001']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="green_candle"
            castShadow
            receiveShadow
            geometry={nodes.green_candle.geometry}
            material={materials.green_candle}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="iron_bars007"
            castShadow
            receiveShadow
            geometry={nodes.iron_bars007.geometry}
            material={materials['iron_bars.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="iron_door_top008"
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Iron_Door009"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door009.geometry}
              material={materials['iron_door_top.007']}
            />
            <mesh
              name="Iron_Door009_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door009_1.geometry}
              material={materials['iron_door_bottom.007']}
            />
          </group>
          <group
            name="iron_door_top009"
            position={[63.389, -197.266, 487.352]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.745}>
            <mesh
              name="Iron_Door010"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door010.geometry}
              material={materials['iron_door_top.007']}
            />
            <mesh
              name="Iron_Door010_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door010_1.geometry}
              material={materials['iron_door_bottom.007']}
            />
          </group>
          <group
            name="iron_door_top010"
            position={[60.704, -198.718, 412.797]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}>
            <mesh
              name="Iron_Door011"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door011.geometry}
              material={materials['iron_door_top.007']}
            />
            <mesh
              name="Iron_Door011_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door011_1.geometry}
              material={materials['iron_door_bottom.007']}
            />
          </group>
          <group
            name="iron_door_top011"
            position={[50.923, -198.718, 172.109]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}>
            <mesh
              name="Iron_Door012"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door012.geometry}
              material={materials['iron_door_top.007']}
            />
            <mesh
              name="Iron_Door012_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door012_1.geometry}
              material={materials['iron_door_bottom.007']}
            />
          </group>
          <group
            name="iron_door_top012"
            position={[75.195, -198.718, 563.999]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}>
            <mesh
              name="Iron_Door013"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door013.geometry}
              material={materials['iron_door_top.007']}
            />
            <mesh
              name="Iron_Door013_1"
              castShadow
              receiveShadow
              geometry={nodes.Iron_Door013_1.geometry}
              material={materials['iron_door_bottom.007']}
            />
          </group>
          <mesh
            name="iron_trapdoor009"
            castShadow
            receiveShadow
            geometry={nodes.iron_trapdoor009.geometry}
            material={materials['iron_trapdoor.008']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="jungle_leaves001"
            castShadow
            receiveShadow
            geometry={nodes.jungle_leaves001.geometry}
            material={materials['jungle_leaves.001']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="jungle_log001"
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Jungle_Log001"
              castShadow
              receiveShadow
              geometry={nodes.Jungle_Log001.geometry}
              material={materials['jungle_log.001']}
            />
            <mesh
              name="Jungle_Log001_1"
              castShadow
              receiveShadow
              geometry={nodes.Jungle_Log001_1.geometry}
              material={materials['jungle_log_top.001']}
            />
          </group>
          <mesh
            name="jungle_sapling001"
            castShadow
            receiveShadow
            geometry={nodes.jungle_sapling001.geometry}
            material={materials['jungle_sapling.001']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="lever008"
            castShadow
            receiveShadow
            geometry={nodes.lever008.geometry}
            material={materials['lever.008']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group name="lilac_top" position={[-729.323, -191.5, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Lilac003"
              castShadow
              receiveShadow
              geometry={nodes.Lilac003.geometry}
              material={materials['lilac_top.002']}
            />
            <mesh
              name="Lilac003_1"
              castShadow
              receiveShadow
              geometry={nodes.Lilac003_1.geometry}
              material={materials['white_tulip.002']}
            />
            <mesh
              name="Lilac003_2"
              castShadow
              receiveShadow
              geometry={nodes.Lilac003_2.geometry}
              material={materials['polished_andesite.007']}
            />
            <mesh
              name="Lilac003_3"
              castShadow
              receiveShadow
              geometry={nodes.Lilac003_3.geometry}
              material={materials.jungle_door_top}
            />
          </group>
          <mesh
            name="lily_of_the_valley002"
            castShadow
            receiveShadow
            geometry={nodes.lily_of_the_valley002.geometry}
            material={materials['lily_of_the_valley.003']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="lily_of_the_valley003"
            castShadow
            receiveShadow
            geometry={nodes.lily_of_the_valley003.geometry}
            material={materials['lily_of_the_valley.003']}
            position={[62.678, -157.879, 479.336]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.745}
          />
          <mesh
            name="lily_of_the_valley005"
            castShadow
            receiveShadow
            geometry={nodes.lily_of_the_valley005.geometry}
            material={materials['lily_of_the_valley.003']}
            position={[59.427, -158.539, 166.587]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.983}
          />
          <mesh
            name="lily_of_the_valley006"
            castShadow
            receiveShadow
            geometry={nodes.lily_of_the_valley006.geometry}
            material={materials['lily_of_the_valley.003']}
            position={[75.699, -166.774, 560.405]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}
          />
          <mesh
            name="mangrove_log"
            castShadow
            receiveShadow
            geometry={nodes.mangrove_log.geometry}
            material={materials.mangrove_log}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="mossy_cobblestone006"
            castShadow
            receiveShadow
            geometry={nodes.mossy_cobblestone006.geometry}
            material={materials['mossy_cobblestone.005']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="mossy_cobblestone007"
            castShadow
            receiveShadow
            geometry={nodes.mossy_cobblestone007.geometry}
            material={materials['mossy_cobblestone.005']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="mossy_cobblestone008"
            castShadow
            receiveShadow
            geometry={nodes.mossy_cobblestone008.geometry}
            material={materials['mossy_cobblestone.005']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="mossy_cobblestone009"
            castShadow
            receiveShadow
            geometry={nodes.mossy_cobblestone009.geometry}
            material={materials['mossy_cobblestone.005']}
            position={[62.121, -178.82, 481.099]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.745}
          />
          <mesh
            name="mossy_cobblestone011"
            castShadow
            receiveShadow
            geometry={nodes.mossy_cobblestone011.geometry}
            material={materials['mossy_cobblestone.005']}
            position={[58.793, -182.336, 168.59]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.983}
          />
          <mesh
            name="mossy_cobblestone012"
            castShadow
            receiveShadow
            geometry={nodes.mossy_cobblestone012.geometry}
            material={materials['mossy_cobblestone.005']}
            position={[75.247, -183.757, 561.834]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}
          />
          <mesh
            name="mud_bricks014"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks014.geometry}
            material={materials['mud_bricks.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="mud_bricks015"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks015.geometry}
            material={materials['mud_bricks.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="mud_bricks016"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks016.geometry}
            material={materials['mud_bricks.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="mud_bricks017"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks017.geometry}
            material={materials['mud_bricks.007']}
            position={[57.253, -172.744, 336.414]}
            rotation={[Math.PI / 2, 0, 1.955]}
            scale={2.108}
          />
          <mesh
            name="mud_bricks018"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks018.geometry}
            material={materials['mud_bricks.007']}
            position={[60.742, -172.744, 338.832]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={2.108}
          />
          <mesh
            name="mud_bricks019"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks019.geometry}
            material={materials['mud_bricks.007']}
            position={[65.072, -174.214, 27.016]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.906}
          />
          <mesh
            name="mud_bricks020"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks020.geometry}
            material={materials['mud_bricks.007']}
            position={[230.457, -197.227, -76.018]}
            rotation={[Math.PI / 2, 0, 0.085]}
            scale={[1.628, 1.147, 1.129]}
          />
          <mesh
            name="mud_bricks021"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks021.geometry}
            material={materials['mud_bricks.007']}
            position={[230.457, -197.227, -76.018]}
            rotation={[Math.PI / 2, 0, 0.085]}
            scale={[1.628, 1.147, 1.129]}
          />
          <mesh
            name="mud_bricks022"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks022.geometry}
            material={materials['mud_bricks.007']}
            position={[-4.451, -197.227, 80.073]}
            rotation={[Math.PI / 2, 0, -3.108]}
            scale={[1.635, 1.139, 1.129]}
          />
          <mesh
            name="mud_bricks023"
            castShadow
            receiveShadow
            geometry={nodes.mud_bricks023.geometry}
            material={materials['mud_bricks.007']}
            position={[-4.451, -197.227, 80.073]}
            rotation={[Math.PI / 2, 0, -3.108]}
            scale={[1.635, 1.139, 1.129]}
          />
          <mesh
            name="oak_leaves001"
            castShadow
            receiveShadow
            geometry={nodes.oak_leaves001.geometry}
            material={materials['oak_leaves.001']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group name="oak_log" position={[-729.323, -191.5, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Oak_Log"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Log.geometry}
              material={materials.oak_log}
            />
            <mesh
              name="Oak_Log_1"
              castShadow
              receiveShadow
              geometry={nodes.Oak_Log_1.geometry}
              material={materials.oak_log_top}
            />
          </group>
          <mesh
            name="oak_planks046"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks046.geometry}
            material={materials['oak_planks.010']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="oak_planks049"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks049.geometry}
            material={materials['oak_planks.010']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="oak_planks050"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks050.geometry}
            material={materials['oak_planks.010']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="oak_planks051"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks051.geometry}
            material={materials['oak_planks.010']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="oak_planks052"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks052.geometry}
            material={materials['oak_planks.010']}
            position={[62.353, -160.989, 482.797]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.745}
          />
          <mesh
            name="oak_planks053"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks053.geometry}
            material={materials['oak_planks.010']}
            position={[63.062, -160.158, 481.342]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.745}
          />
          <mesh
            name="oak_planks056"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks056.geometry}
            material={materials['oak_planks.010']}
            position={[59.058, -162.073, 170.52]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.983}
          />
          <mesh
            name="oak_planks057"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks057.geometry}
            material={materials['oak_planks.010']}
            position={[59.863, -161.129, 168.867]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.983}
          />
          <mesh
            name="oak_planks058"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks058.geometry}
            material={materials['oak_planks.010']}
            position={[75.436, -169.297, 563.211]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}
          />
          <mesh
            name="oak_planks059"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks059.geometry}
            material={materials['oak_planks.010']}
            position={[76.011, -168.623, 562.032]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}
          />
          <mesh
            name="oak_sapling"
            castShadow
            receiveShadow
            geometry={nodes.oak_sapling.geometry}
            material={materials.oak_sapling}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="oak_trapdoor008"
            castShadow
            receiveShadow
            geometry={nodes.oak_trapdoor008.geometry}
            material={materials['oak_trapdoor.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="orange_stained_glass001"
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Orange_Stained_Glass_Pane002"
              castShadow
              receiveShadow
              geometry={nodes.Orange_Stained_Glass_Pane002.geometry}
              material={materials['orange_stained_glass.002']}
            />
            <mesh
              name="Orange_Stained_Glass_Pane002_1"
              castShadow
              receiveShadow
              geometry={nodes.Orange_Stained_Glass_Pane002_1.geometry}
              material={materials['orange_stained_glass_pane_top.002']}
            />
          </group>
          <group
            name="orange_stained_glass002"
            position={[59.566, -159.972, 337.551]}
            rotation={[Math.PI / 2, 0, 1.955]}
            scale={2.108}>
            <mesh
              name="Orange_Stained_Glass_Pane005"
              castShadow
              receiveShadow
              geometry={nodes.Orange_Stained_Glass_Pane005.geometry}
              material={materials['orange_stained_glass.002']}
            />
            <mesh
              name="Orange_Stained_Glass_Pane005_1"
              castShadow
              receiveShadow
              geometry={nodes.Orange_Stained_Glass_Pane005_1.geometry}
              material={materials['orange_stained_glass_pane_top.002']}
            />
          </group>
          <group
            name="orange_stained_glass003"
            position={[60.928, -159.972, 336.262]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={2.108}>
            <mesh
              name="Orange_Stained_Glass_Pane004"
              castShadow
              receiveShadow
              geometry={nodes.Orange_Stained_Glass_Pane004.geometry}
              material={materials['orange_stained_glass.002']}
            />
            <mesh
              name="Orange_Stained_Glass_Pane004_1"
              castShadow
              receiveShadow
              geometry={nodes.Orange_Stained_Glass_Pane004_1.geometry}
              material={materials['orange_stained_glass_pane_top.002']}
            />
          </group>
          <group
            name="orange_stained_glass004"
            position={[230.457, -197.227, -76.018]}
            rotation={[Math.PI / 2, 0, 0.085]}
            scale={[1.628, 1.147, 1.129]}>
            <mesh
              name="Orange_Stained_Glass_Pane008"
              castShadow
              receiveShadow
              geometry={nodes.Orange_Stained_Glass_Pane008.geometry}
              material={materials['orange_stained_glass.002']}
            />
            <mesh
              name="Orange_Stained_Glass_Pane008_1"
              castShadow
              receiveShadow
              geometry={nodes.Orange_Stained_Glass_Pane008_1.geometry}
              material={materials['orange_stained_glass_pane_top.002']}
            />
          </group>
          <group
            name="orange_stained_glass005"
            position={[-4.451, -197.227, 80.073]}
            rotation={[Math.PI / 2, 0, -3.108]}
            scale={[1.635, 1.139, 1.129]}>
            <mesh
              name="Orange_Stained_Glass_Pane009"
              castShadow
              receiveShadow
              geometry={nodes.Orange_Stained_Glass_Pane009.geometry}
              material={materials['orange_stained_glass.002']}
            />
            <mesh
              name="Orange_Stained_Glass_Pane009_1"
              castShadow
              receiveShadow
              geometry={nodes.Orange_Stained_Glass_Pane009_1.geometry}
              material={materials['orange_stained_glass_pane_top.002']}
            />
          </group>
          <mesh
            name="orange_tulip"
            castShadow
            receiveShadow
            geometry={nodes.orange_tulip.geometry}
            material={materials.orange_tulip}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="packed_mud"
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group name="peony_top" position={[-729.323, -191.5, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Peony002"
              castShadow
              receiveShadow
              geometry={nodes.Peony002.geometry}
              material={materials['peony_top.002']}
            />
            <mesh
              name="Peony002_1"
              castShadow
              receiveShadow
              geometry={nodes.Peony002_1.geometry}
              material={materials['green_stained_glass.001']}
            />
            <mesh
              name="Peony002_2"
              castShadow
              receiveShadow
              geometry={nodes.Peony002_2.geometry}
              material={materials['daylight_detector_inverted_top.001']}
            />
          </group>
          <mesh
            name="pink_concrete_powder"
            castShadow
            receiveShadow
            geometry={nodes.pink_concrete_powder.geometry}
            material={materials.pink_concrete_powder}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="pink_stained_glass"
            castShadow
            receiveShadow
            geometry={nodes.pink_stained_glass.geometry}
            material={materials.pink_stained_glass}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="pink_stained_glass001"
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Pink_Stained_Glass_Pane"
              castShadow
              receiveShadow
              geometry={nodes.Pink_Stained_Glass_Pane.geometry}
              material={materials.pink_stained_glass}
            />
            <mesh
              name="Pink_Stained_Glass_Pane_1"
              castShadow
              receiveShadow
              geometry={nodes.Pink_Stained_Glass_Pane_1.geometry}
              material={materials.pink_stained_glass_pane_top}
            />
          </group>
          <mesh
            name="pink_tulip001"
            castShadow
            receiveShadow
            geometry={nodes.pink_tulip001.geometry}
            material={materials['pink_tulip.002']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="pink_tulip002"
            castShadow
            receiveShadow
            geometry={nodes.pink_tulip002.geometry}
            material={materials['pink_tulip.002']}
            position={[62.297, -157.917, 480.788]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.745}
          />
          <mesh
            name="pink_tulip004"
            castShadow
            receiveShadow
            geometry={nodes.pink_tulip004.geometry}
            material={materials['pink_tulip.002']}
            position={[58.993, -158.581, 168.238]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.983}
          />
          <mesh
            name="pink_tulip005"
            castShadow
            receiveShadow
            geometry={nodes.pink_tulip005.geometry}
            material={materials['pink_tulip.002']}
            position={[75.39, -166.805, 561.583]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}
          />
          <mesh
            name="poppy002"
            castShadow
            receiveShadow
            geometry={nodes.poppy002.geometry}
            material={materials['poppy.001']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="poppy003"
            castShadow
            receiveShadow
            geometry={nodes.poppy003.geometry}
            material={materials['poppy.001']}
            position={[59.583, -160.731, 336.4]}
            rotation={[Math.PI / 2, 0, 1.955]}
            scale={2.108}
          />
          <mesh
            name="poppy004"
            castShadow
            receiveShadow
            geometry={nodes.poppy004.geometry}
            material={materials['poppy.001']}
            position={[59.855, -160.731, 336.679]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={2.108}
          />
          <mesh
            name="poppy005"
            castShadow
            receiveShadow
            geometry={nodes.poppy005.geometry}
            material={materials['poppy.001']}
            position={[230.457, -197.227, -76.018]}
            rotation={[Math.PI / 2, 0, 0.085]}
            scale={[1.628, 1.147, 1.129]}
          />
          <mesh
            name="poppy006"
            castShadow
            receiveShadow
            geometry={nodes.poppy006.geometry}
            material={materials['poppy.001']}
            position={[-4.451, -197.227, 80.073]}
            rotation={[Math.PI / 2, 0, -3.108]}
            scale={[1.635, 1.139, 1.129]}
          />
          <mesh
            name="red_sand"
            castShadow
            receiveShadow
            geometry={nodes.red_sand.geometry}
            material={materials.red_sand}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="red_tulip001"
            castShadow
            receiveShadow
            geometry={nodes.red_tulip001.geometry}
            material={materials['red_tulip.001']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="red_tulip002"
            castShadow
            receiveShadow
            geometry={nodes.red_tulip002.geometry}
            material={materials['red_tulip.001']}
            position={[60.362, -161.963, 332.856]}
            rotation={[Math.PI / 2, 0, 1.955]}
            scale={2.108}
          />
          <mesh
            name="red_tulip003"
            castShadow
            receiveShadow
            geometry={nodes.red_tulip003.geometry}
            material={materials['red_tulip.001']}
            position={[56.277, -161.963, 337.286]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={2.108}
          />
          <mesh
            name="red_tulip004"
            castShadow
            receiveShadow
            geometry={nodes.red_tulip004.geometry}
            material={materials['red_tulip.001']}
            position={[230.457, -197.227, -76.018]}
            rotation={[Math.PI / 2, 0, 0.085]}
            scale={[1.628, 1.147, 1.129]}
          />
          <mesh
            name="red_tulip005"
            castShadow
            receiveShadow
            geometry={nodes.red_tulip005.geometry}
            material={materials['red_tulip.001']}
            position={[-4.451, -197.227, 80.073]}
            rotation={[Math.PI / 2, 0, -3.108]}
            scale={[1.635, 1.139, 1.129]}
          />
          <group
            name="rose_bush_top"
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Rose_Bush002"
              castShadow
              receiveShadow
              geometry={nodes.Rose_Bush002.geometry}
              material={materials.rose_bush_top}
            />
            <mesh
              name="Rose_Bush002_1"
              castShadow
              receiveShadow
              geometry={nodes.Rose_Bush002_1.geometry}
              material={materials['dark_oak_leaves.001']}
            />
            <mesh
              name="Rose_Bush002_2"
              castShadow
              receiveShadow
              geometry={nodes.Rose_Bush002_2.geometry}
              material={materials.blue_stained_glass}
            />
            <mesh
              name="Rose_Bush002_3"
              castShadow
              receiveShadow
              geometry={nodes.Rose_Bush002_3.geometry}
              material={materials.blue_stained_glass_pane_top}
            />
            <mesh
              name="Rose_Bush002_4"
              castShadow
              receiveShadow
              geometry={nodes.Rose_Bush002_4.geometry}
              material={materials['dark_prismarine.004']}
            />
            <mesh
              name="Rose_Bush002_5"
              castShadow
              receiveShadow
              geometry={nodes.Rose_Bush002_5.geometry}
              material={materials['smooth_stone_slab_side.003']}
            />
          </group>
          <group
            name="small_dripleaf_top"
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Small_Dripleaf"
              castShadow
              receiveShadow
              geometry={nodes.Small_Dripleaf.geometry}
              material={materials.small_dripleaf_top}
            />
            <mesh
              name="Small_Dripleaf_1"
              castShadow
              receiveShadow
              geometry={nodes.Small_Dripleaf_1.geometry}
              material={materials.small_dripleaf_side}
            />
            <mesh
              name="Small_Dripleaf_2"
              castShadow
              receiveShadow
              geometry={nodes.Small_Dripleaf_2.geometry}
              material={materials.small_dripleaf_stem_top}
            />
            <mesh
              name="Small_Dripleaf_3"
              castShadow
              receiveShadow
              geometry={nodes.Small_Dripleaf_3.geometry}
              material={materials.small_dripleaf_stem_bottom}
            />
          </group>
          <mesh
            name="spruce_leaves001"
            castShadow
            receiveShadow
            geometry={nodes.spruce_leaves001.geometry}
            material={materials['spruce_leaves.001']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="spruce_log001"
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Spruce_Log"
              castShadow
              receiveShadow
              geometry={nodes.Spruce_Log.geometry}
              material={materials['spruce_log.002']}
            />
            <mesh
              name="Spruce_Log_1"
              castShadow
              receiveShadow
              geometry={nodes.Spruce_Log_1.geometry}
              material={materials['spruce_log_top.003']}
            />
          </group>
          <mesh
            name="spruce_log002"
            castShadow
            receiveShadow
            geometry={nodes.spruce_log002.geometry}
            material={materials['spruce_log.002']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="spruce_planks016"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks016.geometry}
            material={materials['spruce_planks.008']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="spruce_planks017"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks017.geometry}
            material={materials['spruce_planks.008']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="spruce_planks018"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks018.geometry}
            material={materials['spruce_planks.008']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="spruce_planks019"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks019.geometry}
            material={materials['spruce_planks.008']}
            position={[58.007, -162.396, 334.56]}
            rotation={[Math.PI / 2, 0, 1.955]}
            scale={2.108}
          />
          <mesh
            name="spruce_planks020"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks020.geometry}
            material={materials['spruce_planks.008']}
            position={[58.856, -164.125, 335.679]}
            rotation={[Math.PI / 2, 0, 1.955]}
            scale={2.108}
          />
          <mesh
            name="spruce_planks021"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks021.geometry}
            material={materials['spruce_planks.008']}
            position={[62.411, -171.134, 338.272]}
            rotation={[Math.PI / 2, 0, 1.955]}
            scale={2.108}
          />
          <mesh
            name="spruce_planks022"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks022.geometry}
            material={materials['spruce_planks.008']}
            position={[58.741, -162.396, 338.83]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={2.108}
          />
          <mesh
            name="spruce_planks023"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks023.geometry}
            material={materials['spruce_planks.008']}
            position={[59.459, -164.125, 337.622]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={2.108}
          />
          <mesh
            name="spruce_planks024"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks024.geometry}
            material={materials['spruce_planks.008']}
            position={[60.529, -171.134, 333.354]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={2.108}
          />
          <mesh
            name="spruce_planks025"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks025.geometry}
            material={materials['spruce_planks.008']}
            position={[64.083, -165.896, 27.105]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.906}
          />
          <mesh
            name="spruce_planks026"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks026.geometry}
            material={materials['spruce_planks.008']}
            position={[63.53, -161.926, 25.695]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.906}
          />
          <mesh
            name="spruce_planks032"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks032.geometry}
            material={materials['spruce_planks.008']}
            position={[230.457, -197.227, -76.018]}
            rotation={[Math.PI / 2, 0, 0.085]}
            scale={[1.628, 1.147, 1.129]}
          />
          <mesh
            name="spruce_planks033"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks033.geometry}
            material={materials['spruce_planks.008']}
            position={[230.457, -197.227, -76.018]}
            rotation={[Math.PI / 2, 0, 0.085]}
            scale={[1.628, 1.147, 1.129]}
          />
          <mesh
            name="spruce_planks034"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks034.geometry}
            material={materials['spruce_planks.008']}
            position={[-4.451, -197.227, 80.073]}
            rotation={[Math.PI / 2, 0, -3.108]}
            scale={[1.635, 1.139, 1.129]}
          />
          <mesh
            name="spruce_planks035"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks035.geometry}
            material={materials['spruce_planks.008']}
            position={[-4.451, -197.227, 80.073]}
            rotation={[Math.PI / 2, 0, -3.108]}
            scale={[1.635, 1.139, 1.129]}
          />
          <mesh
            name="spruce_sapling"
            castShadow
            receiveShadow
            geometry={nodes.spruce_sapling.geometry}
            material={materials.spruce_sapling}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="spruce_trapdoor001"
            castShadow
            receiveShadow
            geometry={nodes.spruce_trapdoor001.geometry}
            material={materials['spruce_trapdoor.002']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="spruce_trapdoor002"
            castShadow
            receiveShadow
            geometry={nodes.spruce_trapdoor002.geometry}
            material={materials['spruce_trapdoor.002']}
            position={[60.192, -181.363, 337.563]}
            rotation={[Math.PI / 2, 0, 1.955]}
            scale={2.108}
          />
          <mesh
            name="spruce_trapdoor003"
            castShadow
            receiveShadow
            geometry={nodes.spruce_trapdoor003.geometry}
            material={materials['spruce_trapdoor.002']}
            position={[60.705, -181.363, 335.677]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={2.108}
          />
          <mesh
            name="spruce_trapdoor006"
            castShadow
            receiveShadow
            geometry={nodes.spruce_trapdoor006.geometry}
            material={materials['spruce_trapdoor.002']}
            position={[230.457, -197.227, -76.018]}
            rotation={[Math.PI / 2, 0, 0.085]}
            scale={[1.628, 1.147, 1.129]}
          />
          <mesh
            name="spruce_trapdoor007"
            castShadow
            receiveShadow
            geometry={nodes.spruce_trapdoor007.geometry}
            material={materials['spruce_trapdoor.002']}
            position={[-4.451, -197.227, 80.073]}
            rotation={[Math.PI / 2, 0, -3.108]}
            scale={[1.635, 1.139, 1.129]}
          />
          <mesh
            name="stripped_jungle_log"
            castShadow
            receiveShadow
            geometry={nodes.stripped_jungle_log.geometry}
            material={materials.stripped_jungle_log}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="sunflower_back"
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Large_Fern002"
              castShadow
              receiveShadow
              geometry={nodes.Large_Fern002.geometry}
              material={materials.sunflower_back}
            />
            <mesh
              name="Large_Fern002_1"
              castShadow
              receiveShadow
              geometry={nodes.Large_Fern002_1.geometry}
              material={materials.sunflower_front}
            />
            <mesh
              name="Large_Fern002_2"
              castShadow
              receiveShadow
              geometry={nodes.Large_Fern002_2.geometry}
              material={materials['large_fern_bottom.002']}
            />
            <mesh
              name="Large_Fern002_3"
              castShadow
              receiveShadow
              geometry={nodes.Large_Fern002_3.geometry}
              material={materials.large_fern_top}
            />
            <mesh
              name="Large_Fern002_4"
              castShadow
              receiveShadow
              geometry={nodes.Large_Fern002_4.geometry}
              material={materials['acacia_leaves.001']}
            />
            <mesh
              name="Large_Fern002_5"
              castShadow
              receiveShadow
              geometry={nodes.Large_Fern002_5.geometry}
              material={materials['polished_granite.002']}
            />
          </group>
          <group
            name="sunflower_back001"
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Tall_Grass004"
              castShadow
              receiveShadow
              geometry={nodes.Tall_Grass004.geometry}
              material={materials.sunflower_back}
            />
            <mesh
              name="Tall_Grass004_1"
              castShadow
              receiveShadow
              geometry={nodes.Tall_Grass004_1.geometry}
              material={materials.sunflower_front}
            />
            <mesh
              name="Tall_Grass004_2"
              castShadow
              receiveShadow
              geometry={nodes.Tall_Grass004_2.geometry}
              material={materials['tall_grass_bottom.003']}
            />
            <mesh
              name="Tall_Grass004_3"
              castShadow
              receiveShadow
              geometry={nodes.Tall_Grass004_3.geometry}
              material={materials['tall_grass_top.001']}
            />
            <mesh
              name="Tall_Grass004_4"
              castShadow
              receiveShadow
              geometry={nodes.Tall_Grass004_4.geometry}
              material={materials.oxeye_daisy}
            />
            <mesh
              name="Tall_Grass004_5"
              castShadow
              receiveShadow
              geometry={nodes.Tall_Grass004_5.geometry}
              material={materials.gray_stained_glass}
            />
            <mesh
              name="Tall_Grass004_6"
              castShadow
              receiveShadow
              geometry={nodes.Tall_Grass004_6.geometry}
              material={materials['polished_diorite.006']}
            />
            <mesh
              name="Tall_Grass004_7"
              castShadow
              receiveShadow
              geometry={nodes.Tall_Grass004_7.geometry}
              material={materials.acacia_door_top}
            />
          </group>
          <group
            name="sunflower_top"
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Sunflower001"
              castShadow
              receiveShadow
              geometry={nodes.Sunflower001.geometry}
              material={materials.sunflower_top}
            />
            <mesh
              name="Sunflower001_1"
              castShadow
              receiveShadow
              geometry={nodes.Sunflower001_1.geometry}
              material={materials['red_tulip.001']}
            />
            <mesh
              name="Sunflower001_2"
              castShadow
              receiveShadow
              geometry={nodes.Sunflower001_2.geometry}
              material={materials.light_blue_stained_glass}
            />
            <mesh
              name="Sunflower001_3"
              castShadow
              receiveShadow
              geometry={nodes.Sunflower001_3.geometry}
              material={materials.light_blue_stained_glass_pane_top}
            />
            <mesh
              name="Sunflower001_4"
              castShadow
              receiveShadow
              geometry={nodes.Sunflower001_4.geometry}
              material={materials.slime_block}
            />
            <mesh
              name="Sunflower001_5"
              castShadow
              receiveShadow
              geometry={nodes.Sunflower001_5.geometry}
              material={materials.birch_door_top}
            />
          </group>
          <mesh
            name="vine"
            castShadow
            receiveShadow
            geometry={nodes.vine.geometry}
            material={materials.vine}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="warped_planks005"
            castShadow
            receiveShadow
            geometry={nodes.warped_planks005.geometry}
            material={materials['warped_planks.003']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="white_candle008"
            castShadow
            receiveShadow
            geometry={nodes.white_candle008.geometry}
            material={materials['white_candle.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="white_concrete_powder008"
            castShadow
            receiveShadow
            geometry={nodes.white_concrete_powder008.geometry}
            material={materials['white_concrete_powder.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="white_concrete_powder009"
            castShadow
            receiveShadow
            geometry={nodes.white_concrete_powder009.geometry}
            material={materials['white_concrete_powder.007']}
            position={[63.607, -174.814, 483.532]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.745}
          />
          <mesh
            name="white_concrete_powder011"
            castShadow
            receiveShadow
            geometry={nodes.white_concrete_powder011.geometry}
            material={materials['white_concrete_powder.007']}
            position={[60.483, -177.784, 171.356]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.983}
          />
          <mesh
            name="white_concrete_powder012"
            castShadow
            receiveShadow
            geometry={nodes.white_concrete_powder012.geometry}
            material={materials['white_concrete_powder.007']}
            position={[76.453, -180.509, 563.808]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}
          />
          <mesh
            name="white_stained_glass009"
            castShadow
            receiveShadow
            geometry={nodes.white_stained_glass009.geometry}
            material={materials['white_stained_glass.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="white_stained_glass010"
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="White_Stained_Glass_Pane009"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane009.geometry}
              material={materials['white_stained_glass.007']}
            />
            <mesh
              name="White_Stained_Glass_Pane009_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane009_1.geometry}
              material={materials['white_stained_glass_pane_top.007']}
            />
          </group>
          <mesh
            name="white_stained_glass011"
            castShadow
            receiveShadow
            geometry={nodes.white_stained_glass011.geometry}
            material={materials['white_stained_glass.007']}
            position={[63.257, -159.145, 484.588]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.745}
          />
          <group
            name="white_stained_glass012"
            position={[62.863, -157.111, 480.466]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.745}>
            <mesh
              name="White_Stained_Glass_Pane010"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane010.geometry}
              material={materials['white_stained_glass.007']}
            />
            <mesh
              name="White_Stained_Glass_Pane010_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane010_1.geometry}
              material={materials['white_stained_glass_pane_top.007']}
            />
          </group>
          <mesh
            name="white_stained_glass015"
            castShadow
            receiveShadow
            geometry={nodes.white_stained_glass015.geometry}
            material={materials['white_stained_glass.007']}
            position={[60.085, -159.977, 172.556]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.983}
          />
          <group
            name="white_stained_glass016"
            position={[59.637, -157.666, 167.872]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.983}>
            <mesh
              name="White_Stained_Glass_Pane012"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane012.geometry}
              material={materials['white_stained_glass.007']}
            />
            <mesh
              name="White_Stained_Glass_Pane012_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane012_1.geometry}
              material={materials['white_stained_glass_pane_top.007']}
            />
          </group>
          <mesh
            name="white_stained_glass017"
            castShadow
            receiveShadow
            geometry={nodes.white_stained_glass017.geometry}
            material={materials['white_stained_glass.007']}
            position={[76.169, -167.801, 564.665]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}
          />
          <group
            name="white_stained_glass018"
            position={[75.849, -166.151, 561.322]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}>
            <mesh
              name="White_Stained_Glass_Pane013"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane013.geometry}
              material={materials['white_stained_glass.007']}
            />
            <mesh
              name="White_Stained_Glass_Pane013_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane013_1.geometry}
              material={materials['white_stained_glass_pane_top.007']}
            />
          </group>
          <mesh
            name="white_tulip001"
            castShadow
            receiveShadow
            geometry={nodes.white_tulip001.geometry}
            material={materials['white_tulip.002']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="white_tulip002"
            castShadow
            receiveShadow
            geometry={nodes.white_tulip002.geometry}
            material={materials['white_tulip.002']}
            position={[64.343, -159.099, 483.426]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.745}
          />
          <mesh
            name="white_tulip004"
            castShadow
            receiveShadow
            geometry={nodes.white_tulip004.geometry}
            material={materials['white_tulip.002']}
            position={[56.758, -159.925, 171.235]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.983}
          />
          <mesh
            name="white_tulip005"
            castShadow
            receiveShadow
            geometry={nodes.white_tulip005.geometry}
            material={materials['white_tulip.002']}
            position={[77.05, -167.764, 563.722]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.415}
          />
          <mesh
            name="white_wool014"
            castShadow
            receiveShadow
            geometry={nodes.white_wool014.geometry}
            material={materials['white_wool.007']}
            position={[-729.323, -191.5, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
        </group>
        <group name="(2)_mcprep_empty014" position={[0, 191, -0.5]}>
          <group name="anvil013" position={[-1001.533, -191, 0.5]} rotation={[Math.PI / 2, 0, 0]} />
          <group
            name="barrel_side001"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="bedrock008"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="big_dripleaf_top002"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="birch_log002"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="birch_planks035"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="birch_planks036"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks036.geometry}
            material={materials['birch_planks.010']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="birch_planks044"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="birch_planks045"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="birch_planks046"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks046.geometry}
            material={materials['birch_planks.010']}
            position={[129.792, -189.282, 534.32]}
            rotation={[Math.PI / 2, 0, 2.916]}
          />
          <mesh
            name="birch_planks047"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks047.geometry}
            material={materials['birch_planks.010']}
            position={[128.898, -189.251, 530.421]}
            rotation={[Math.PI / 2, 0, 2.916]}
          />
          <mesh
            name="birch_planks048"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks048.geometry}
            material={materials['birch_planks.010']}
            position={[124.919, -189.306, 434.849]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <mesh
            name="birch_planks049"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks049.geometry}
            material={materials['birch_planks.010']}
            position={[126.228, -189.306, 432.107]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <mesh
            name="birch_planks050"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks050.geometry}
            material={materials['birch_planks.010']}
            position={[124.982, -190.275, 435.419]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <mesh
            name="birch_trapdoor008"
            castShadow
            receiveShadow
            geometry={nodes.birch_trapdoor008.geometry}
            material={materials['birch_trapdoor.005']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="black_concrete004"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="black_concrete005"
            castShadow
            receiveShadow
            geometry={nodes.black_concrete005.geometry}
            material={materials['black_concrete.005']}
            position={[127.726, -189.79, 425.563]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <group
            name="black_stained_glass003"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Black_Stained_Glass_Pane003"
              castShadow
              receiveShadow
              geometry={nodes.Black_Stained_Glass_Pane003.geometry}
              material={materials['black_stained_glass.004']}
            />
            <mesh
              name="Black_Stained_Glass_Pane003_1"
              castShadow
              receiveShadow
              geometry={nodes.Black_Stained_Glass_Pane003_1.geometry}
              material={materials['black_stained_glass_pane_top.004']}
            />
          </group>
          <group
            name="black_stained_glass004"
            position={[130.985, -188.282, 591.252]}
            rotation={[Math.PI / 2, 0, -0.21]}>
            <mesh
              name="Black_Stained_Glass_Pane004"
              castShadow
              receiveShadow
              geometry={nodes.Black_Stained_Glass_Pane004.geometry}
              material={materials['black_stained_glass.004']}
            />
            <mesh
              name="Black_Stained_Glass_Pane004_1"
              castShadow
              receiveShadow
              geometry={nodes.Black_Stained_Glass_Pane004_1.geometry}
              material={materials['black_stained_glass_pane_top.004']}
            />
          </group>
          <group
            name="black_stained_glass005"
            position={[126.588, -188.306, 430.591]}
            rotation={[Math.PI / 2, 0, 0.223]}>
            <mesh
              name="Black_Stained_Glass_Pane005"
              castShadow
              receiveShadow
              geometry={nodes.Black_Stained_Glass_Pane005.geometry}
              material={materials['black_stained_glass.004']}
            />
            <mesh
              name="Black_Stained_Glass_Pane005_1"
              castShadow
              receiveShadow
              geometry={nodes.Black_Stained_Glass_Pane005_1.geometry}
              material={materials['black_stained_glass_pane_top.004']}
            />
          </group>
          <group
            name="blackstone006"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="bricks007"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="brown_wool001"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="brown_wool002"
            castShadow
            receiveShadow
            geometry={nodes.brown_wool002.geometry}
            material={materials['brown_wool.002']}
            position={[130.756, -187.751, 531.534]}
            rotation={[Math.PI / 2, 0, 2.916]}
          />
          <mesh
            name="chain009"
            castShadow
            receiveShadow
            geometry={nodes.chain009.geometry}
            material={materials['chain.009']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="cobblestone030"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone030.geometry}
            material={materials['cobblestone.009']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="cobblestone031"
            castShadow
            receiveShadow
            geometry={nodes.cobblestone031.geometry}
            material={materials['cobblestone.009']}
            position={[127.657, -189.306, 428.132]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <mesh
            name="crimson_planks"
            castShadow
            receiveShadow
            geometry={nodes.crimson_planks.geometry}
            material={materials.crimson_planks}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="crimson_planks001"
            castShadow
            receiveShadow
            geometry={nodes.crimson_planks001.geometry}
            material={materials.crimson_planks}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="crimson_planks002"
            castShadow
            receiveShadow
            geometry={nodes.crimson_planks002.geometry}
            material={materials.crimson_planks}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="crimson_planks003"
            castShadow
            receiveShadow
            geometry={nodes.crimson_planks003.geometry}
            material={materials.crimson_planks}
            position={[131.403, -188.751, 593.208]}
            rotation={[Math.PI / 2, 0, -0.21]}
          />
          <mesh
            name="crimson_planks004"
            castShadow
            receiveShadow
            geometry={nodes.crimson_planks004.geometry}
            material={materials.crimson_planks}
            position={[130.582, -190.036, 589.401]}
            rotation={[Math.PI / 2, 0, -0.21]}
          />
          <mesh
            name="crimson_planks005"
            castShadow
            receiveShadow
            geometry={nodes.crimson_planks005.geometry}
            material={materials.crimson_planks}
            position={[130.358, -189.282, 588.318]}
            rotation={[Math.PI / 2, 0, -0.21]}
          />
          <mesh
            name="crimson_trapdoor"
            castShadow
            receiveShadow
            geometry={nodes.crimson_trapdoor.geometry}
            material={materials.crimson_trapdoor}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="crimson_trapdoor001"
            castShadow
            receiveShadow
            geometry={nodes.crimson_trapdoor001.geometry}
            material={materials.crimson_trapdoor}
            position={[131.004, -189.734, 591.341]}
            rotation={[Math.PI / 2, 0, -0.21]}
          />
          <group
            name="dark_oak_planks015"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="dark_oak_planks016"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dark_oak_planks017"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks017.geometry}
            material={materials['dark_oak_planks.008']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dark_oak_planks018"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks018.geometry}
            material={materials['dark_oak_planks.008']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dark_oak_planks019"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks019.geometry}
            material={materials['dark_oak_planks.008']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="dark_oak_planks020"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dark_oak_planks021"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks021.geometry}
            material={materials['dark_oak_planks.008']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dark_oak_planks022"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks022.geometry}
            material={materials['dark_oak_planks.008']}
            position={[131.56, -190.126, 593.941]}
            rotation={[Math.PI / 2, 0, -0.21]}
          />
          <mesh
            name="dark_oak_planks023"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks023.geometry}
            material={materials['dark_oak_planks.008']}
            position={[130.358, -188.532, 588.318]}
            rotation={[Math.PI / 2, 0, -0.21]}
          />
          <mesh
            name="dark_oak_planks024"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks024.geometry}
            material={materials['dark_oak_planks.008']}
            position={[130.032, -190.251, 586.79]}
            rotation={[Math.PI / 2, 0, -0.21]}
          />
          <mesh
            name="dark_oak_planks025"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks025.geometry}
            material={materials['dark_oak_planks.008']}
            position={[130.756, -190.126, 531.534]}
            rotation={[Math.PI / 2, 0, 2.916]}
          />
          <mesh
            name="dark_oak_planks026"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks026.geometry}
            material={materials['dark_oak_planks.008']}
            position={[131.315, -188.751, 533.971]}
            rotation={[Math.PI / 2, 0, 2.916]}
          />
          <mesh
            name="dark_oak_planks027"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks027.geometry}
            material={materials['dark_oak_planks.008']}
            position={[129.849, -190.251, 527.574]}
            rotation={[Math.PI / 2, 0, 2.916]}
          />
          <mesh
            name="dark_oak_planks028"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks028.geometry}
            material={materials['dark_oak_planks.008']}
            position={[126.256, -189.306, 432.054]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <mesh
            name="dark_oak_planks029"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks029.geometry}
            material={materials['dark_oak_planks.008']}
            position={[127.802, -190.15, 425.227]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <mesh
            name="dark_oak_planks030"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks030.geometry}
            material={materials['dark_oak_planks.008']}
            position={[126.938, -189.306, 429.044]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <mesh
            name="dark_oak_planks031"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks031.geometry}
            material={materials['dark_oak_planks.008']}
            position={[127.705, -190.275, 425.654]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <mesh
            name="dark_oak_trapdoor002"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_trapdoor002.geometry}
            material={materials['dark_oak_trapdoor.004']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dark_oak_trapdoor003"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_trapdoor003.geometry}
            material={materials['dark_oak_trapdoor.004']}
            position={[130.358, -188.688, 588.318]}
            rotation={[Math.PI / 2, 0, -0.21]}
          />
          <mesh
            name="dark_oak_trapdoor004"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_trapdoor004.geometry}
            material={materials['dark_oak_trapdoor.004']}
            position={[130.515, -188.911, 530.481]}
            rotation={[Math.PI / 2, 0, 2.916]}
          />
          <group
            name="dark_prismarine003"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="daylight_detector_side"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="daylight_detector_side002"
            position={[127.155, -189.591, 428.084]}
            rotation={[Math.PI / 2, 0, 0.223]}>
            <mesh
              name="Inverted_Daylight_Sensor002"
              castShadow
              receiveShadow
              geometry={nodes.Inverted_Daylight_Sensor002.geometry}
              material={materials['daylight_detector_side.002']}
            />
            <mesh
              name="Inverted_Daylight_Sensor002_1"
              castShadow
              receiveShadow
              geometry={nodes.Inverted_Daylight_Sensor002_1.geometry}
              material={materials['daylight_detector_inverted_top.002']}
            />
          </group>
          <group
            name="dead_fire_coral008"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="dead_tube_coral_fan016"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dead_tube_coral_fan017"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral_fan017.geometry}
            material={materials['dead_tube_coral_fan.008']}
            position={[131.529, -190.282, 534.905]}
            rotation={[Math.PI / 2, 0, 2.916]}
          />
          <mesh
            name="deepslate_tiles"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles.geometry}
            material={materials['deepslate_tiles.010']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="deepslate_tiles018"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles018.geometry}
            material={materials['deepslate_tiles.010']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="deepslate_tiles022"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles022.geometry}
            material={materials['deepslate_tiles.010']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="deepslate_tiles023"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles023.geometry}
            material={materials['deepslate_tiles.010']}
            position={[130.789, -189.867, 531.723]}
            rotation={[Math.PI / 2, 0, 2.916]}
          />
          <mesh
            name="deepslate_tiles024"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles024.geometry}
            material={materials['deepslate_tiles.010']}
            position={[130.003, -189.282, 528.244]}
            rotation={[Math.PI / 2, 0, 2.916]}
          />
          <mesh
            name="deepslate_tiles025"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles025.geometry}
            material={materials['deepslate_tiles.010']}
            position={[130.442, -189.298, 530.163]}
            rotation={[Math.PI / 2, 0, 2.916]}
          />
          <group
            name="dried_kelp_top006"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="granite009"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="gray_concrete003"
            castShadow
            receiveShadow
            geometry={nodes.gray_concrete003.geometry}
            material={materials['gray_concrete.004']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="gray_concrete004"
            castShadow
            receiveShadow
            geometry={nodes.gray_concrete004.geometry}
            material={materials['gray_concrete.004']}
            position={[130.98, -189.282, 532.509]}
            rotation={[Math.PI / 2, 0, 2.916]}
          />
          <mesh
            name="gray_wool010"
            castShadow
            receiveShadow
            geometry={nodes.gray_wool010.geometry}
            material={materials['gray_wool.007']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="gray_wool011"
            castShadow
            receiveShadow
            geometry={nodes.gray_wool011.geometry}
            material={materials['gray_wool.007']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="iron_bars008"
            castShadow
            receiveShadow
            geometry={nodes.iron_bars008.geometry}
            material={materials['iron_bars.008']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="iron_bars009"
            castShadow
            receiveShadow
            geometry={nodes.iron_bars009.geometry}
            material={materials['iron_bars.008']}
            position={[130.913, -188.711, 590.916]}
            rotation={[Math.PI / 2, 0, -0.21]}
          />
          <mesh
            name="iron_bars010"
            castShadow
            receiveShadow
            geometry={nodes.iron_bars010.geometry}
            material={materials['iron_bars.008']}
            position={[130.664, -188.711, 531.129]}
            rotation={[Math.PI / 2, 0, 2.916]}
          />
          <group
            name="iron_trapdoor010"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="jungle_planks004"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="jungle_planks005"
            castShadow
            receiveShadow
            geometry={nodes.jungle_planks005.geometry}
            material={materials['jungle_planks.004']}
            position={[131.944, -189.251, 529.723]}
            rotation={[Math.PI / 2, 0, 2.916]}
          />
          <mesh
            name="lever009"
            castShadow
            receiveShadow
            geometry={nodes.lever009.geometry}
            material={materials['lever.009']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="lever010"
            castShadow
            receiveShadow
            geometry={nodes.lever010.geometry}
            material={materials['lever.009']}
            position={[127.635, -189.199, 428.23]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <group
            name="light_gray_concrete002"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="light_gray_concrete003"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_concrete003.geometry}
            material={materials['light_gray_concrete.002']}
            position={[126.698, -190.79, 430.104]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <group
            name="light_gray_stained_glass003"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="light_gray_wool005"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_wool005.geometry}
            material={materials['light_gray_wool.005']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="light_gray_wool006"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_wool006.geometry}
            material={materials['light_gray_wool.005']}
            position={[130.421, -189.745, 530.072]}
            rotation={[Math.PI / 2, 0, 2.916]}
          />
          <mesh
            name="lightning_rod002"
            castShadow
            receiveShadow
            geometry={nodes.lightning_rod002.geometry}
            material={materials['lightning_rod.003']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="lightning_rod003"
            castShadow
            receiveShadow
            geometry={nodes.lightning_rod003.geometry}
            material={materials['lightning_rod.003']}
            position={[131.612, -190.282, 594.186]}
            rotation={[Math.PI / 2, 0, -0.21]}
          />
          <group
            name="mangrove_planks009"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="mangrove_planks010"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="mangrove_planks011"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="mangrove_planks012"
            castShadow
            receiveShadow
            geometry={nodes.mangrove_planks012.geometry}
            material={materials['mangrove_planks.005']}
            position={[125.476, -190.306, 435.499]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <mesh
            name="mangrove_planks013"
            castShadow
            receiveShadow
            geometry={nodes.mangrove_planks013.geometry}
            material={materials['mangrove_planks.005']}
            position={[126.468, -190.056, 430.667]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <mesh
            name="mangrove_trapdoor003"
            castShadow
            receiveShadow
            geometry={nodes.mangrove_trapdoor003.geometry}
            material={materials['mangrove_trapdoor.004']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="mossy_cobblestone010"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Cobblestone_Wall008"
              castShadow
              receiveShadow
              geometry={nodes.Cobblestone_Wall008.geometry}
              material={materials['mossy_cobblestone.006']}
            />
            <mesh
              name="Cobblestone_Wall008_1"
              castShadow
              receiveShadow
              geometry={nodes.Cobblestone_Wall008_1.geometry}
              material={materials['sandstone.006']}
            />
            <mesh
              name="Cobblestone_Wall008_2"
              castShadow
              receiveShadow
              geometry={nodes.Cobblestone_Wall008_2.geometry}
              material={materials['red_nether_bricks.003']}
            />
            <mesh
              name="Cobblestone_Wall008_3"
              castShadow
              receiveShadow
              geometry={nodes.Cobblestone_Wall008_3.geometry}
              material={materials['deepslate_tiles.010']}
            />
          </group>
          <mesh
            name="mossy_cobblestone013"
            castShadow
            receiveShadow
            geometry={nodes.mossy_cobblestone013.geometry}
            material={materials['mossy_cobblestone.006']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="mossy_cobblestone014"
            castShadow
            receiveShadow
            geometry={nodes.mossy_cobblestone014.geometry}
            material={materials['mossy_cobblestone.006']}
            position={[130.606, -189.313, 589.479]}
            rotation={[Math.PI / 2, 0, -0.21]}
          />
          <mesh
            name="mossy_cobblestone015"
            castShadow
            receiveShadow
            geometry={nodes.mossy_cobblestone015.geometry}
            material={materials['mossy_cobblestone.006']}
            position={[130.61, -189.321, 589.495]}
            rotation={[Math.PI / 2, 0, -0.21]}
          />
          <group
            name="nether_bricks001"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="nether_bricks002"
            castShadow
            receiveShadow
            geometry={nodes.nether_bricks002.geometry}
            material={materials['nether_bricks.002']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="nether_bricks003"
            castShadow
            receiveShadow
            geometry={nodes.nether_bricks003.geometry}
            material={materials['nether_bricks.002']}
            position={[130.4, -189.282, 529.979]}
            rotation={[Math.PI / 2, 0, 2.916]}
          />
          <mesh
            name="nether_bricks004"
            castShadow
            receiveShadow
            geometry={nodes.nether_bricks004.geometry}
            material={materials['nether_bricks.002']}
            position={[126.477, -188.306, 431.079]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <group
            name="oak_door_top014"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="oak_planks054"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Bed001"
              castShadow
              receiveShadow
              geometry={nodes.Bed001.geometry}
              material={materials['oak_planks.011']}
            />
            <mesh
              name="Bed001_1"
              castShadow
              receiveShadow
              geometry={nodes.Bed001_1.geometry}
              material={materials['MW_bed_feet_top.001']}
            />
            <mesh
              name="Bed001_2"
              castShadow
              receiveShadow
              geometry={nodes.Bed001_2.geometry}
              material={materials['MW_bed_feet_end.001']}
            />
            <mesh
              name="Bed001_3"
              castShadow
              receiveShadow
              geometry={nodes.Bed001_3.geometry}
              material={materials['MW_bed_feet_side.001']}
            />
          </group>
          <group
            name="oak_planks055"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="oak_planks060"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="oak_planks061"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks061.geometry}
            material={materials['oak_planks.011']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="oak_planks062"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="oak_planks063"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks063.geometry}
            material={materials['oak_planks.011']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="oak_planks064"
            position={[131.403, -189.532, 593.208]}
            rotation={[Math.PI / 2, 0, -0.21]}>
            <mesh
              name="Bed002"
              castShadow
              receiveShadow
              geometry={nodes.Bed002.geometry}
              material={materials['oak_planks.011']}
            />
            <mesh
              name="Bed002_1"
              castShadow
              receiveShadow
              geometry={nodes.Bed002_1.geometry}
              material={materials['MW_bed_feet_top.001']}
            />
            <mesh
              name="Bed002_2"
              castShadow
              receiveShadow
              geometry={nodes.Bed002_2.geometry}
              material={materials['MW_bed_feet_end.001']}
            />
            <mesh
              name="Bed002_3"
              castShadow
              receiveShadow
              geometry={nodes.Bed002_3.geometry}
              material={materials['MW_bed_feet_side.001']}
            />
          </group>
          <mesh
            name="oak_planks065"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks065.geometry}
            material={materials['oak_planks.011']}
            position={[130.646, -189.282, 589.663]}
            rotation={[Math.PI / 2, 0, -0.21]}
          />
          <group
            name="oak_planks066"
            position={[127.36, -189.556, 427.178]}
            rotation={[Math.PI / 2, 0, 0.223]}>
            <mesh
              name="Bed003"
              castShadow
              receiveShadow
              geometry={nodes.Bed003.geometry}
              material={materials['oak_planks.011']}
            />
            <mesh
              name="Bed003_1"
              castShadow
              receiveShadow
              geometry={nodes.Bed003_1.geometry}
              material={materials['MW_bed_feet_top.001']}
            />
            <mesh
              name="Bed003_2"
              castShadow
              receiveShadow
              geometry={nodes.Bed003_2.geometry}
              material={materials['MW_bed_feet_end.001']}
            />
            <mesh
              name="Bed003_3"
              castShadow
              receiveShadow
              geometry={nodes.Bed003_3.geometry}
              material={materials['MW_bed_feet_side.001']}
            />
          </group>
          <mesh
            name="oak_planks067"
            castShadow
            receiveShadow
            geometry={nodes.oak_planks067.geometry}
            material={materials['oak_planks.011']}
            position={[126.908, -189.208, 429.501]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <mesh
            name="oak_trapdoor009"
            castShadow
            receiveShadow
            geometry={nodes.oak_trapdoor009.geometry}
            material={materials['oak_trapdoor.008']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="oak_trapdoor010"
            castShadow
            receiveShadow
            geometry={nodes.oak_trapdoor010.geometry}
            material={materials['oak_trapdoor.008']}
            position={[130.71, -190.082, 589.962]}
            rotation={[Math.PI / 2, 0, -0.21]}
          />
          <mesh
            name="oak_trapdoor011"
            castShadow
            receiveShadow
            geometry={nodes.oak_trapdoor011.geometry}
            material={materials['oak_trapdoor.008']}
            position={[130.574, -190.082, 530.736]}
            rotation={[Math.PI / 2, 0, 2.916]}
          />
          <group
            name="observer_back001"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="oxidized_cut_copper003"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="piston_side"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="piston_side001"
            castShadow
            receiveShadow
            geometry={nodes.piston_side001.geometry}
            material={materials['piston_side.009']}
            position={[126.903, -189.422, 428.228]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <group
            name="piston_top008"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="piston_top009"
            castShadow
            receiveShadow
            geometry={nodes.piston_top009.geometry}
            material={materials['piston_top.008']}
            position={[126.118, -188.868, 425.871]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <group
            name="polished_blackstone001"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="polished_blackstone002"
            castShadow
            receiveShadow
            geometry={nodes.polished_blackstone002.geometry}
            material={materials['polished_blackstone.003']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="polished_blackstone003"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="polished_blackstone004"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="polished_blackstone005"
            castShadow
            receiveShadow
            geometry={nodes.polished_blackstone005.geometry}
            material={materials['polished_blackstone.003']}
            position={[126.604, -189.306, 430.518]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <mesh
            name="polished_blackstone006"
            castShadow
            receiveShadow
            geometry={nodes.polished_blackstone006.geometry}
            material={materials['polished_blackstone.003']}
            position={[126.613, -190.084, 430.48]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <mesh
            name="polished_blackstone007"
            castShadow
            receiveShadow
            geometry={nodes.polished_blackstone007.geometry}
            material={materials['polished_blackstone.003']}
            position={[125.766, -189.306, 434.27]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <group
            name="polished_blackstone_bricks"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="polished_blackstone_bricks001"
            castShadow
            receiveShadow
            geometry={nodes.polished_blackstone_bricks001.geometry}
            material={materials.polished_blackstone_bricks}
            position={[126.578, -190.065, 430.722]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <group
            name="polished_deepslate013"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="polished_deepslate014"
            castShadow
            receiveShadow
            geometry={nodes.polished_deepslate014.geometry}
            material={materials['polished_deepslate.008']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="polished_deepslate015"
            castShadow
            receiveShadow
            geometry={nodes.polished_deepslate015.geometry}
            material={materials['polished_deepslate.008']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="polished_deepslate016"
            castShadow
            receiveShadow
            geometry={nodes.polished_deepslate016.geometry}
            material={materials['polished_deepslate.008']}
            position={[130.771, -190.037, 531.552]}
            rotation={[Math.PI / 2, 0, 2.916]}
          />
          <mesh
            name="polished_deepslate017"
            castShadow
            receiveShadow
            geometry={nodes.polished_deepslate017.geometry}
            material={materials['polished_deepslate.008']}
            position={[126.698, -190.306, 430.104]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <group
            name="polished_diorite012"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="prismarine_bricks004"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="pumpkin_stem011"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="pumpkin_top006"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="pumpkin_top007"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Skeleton_Wall_Skull005"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull005.geometry}
              material={materials['pumpkin_top.005']}
            />
            <mesh
              name="Skeleton_Wall_Skull005_1"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull005_1.geometry}
              material={materials['pumpkin_side.005']}
            />
            <mesh
              name="Skeleton_Wall_Skull005_2"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull005_2.geometry}
              material={materials['carved_pumpkin.005']}
            />
          </group>
          <group
            name="pumpkin_top008"
            position={[131.56, -189.532, 593.941]}
            rotation={[Math.PI / 2, 0, -0.21]}>
            <mesh
              name="Skeleton_Wall_Skull006"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull006.geometry}
              material={materials['pumpkin_top.005']}
            />
            <mesh
              name="Skeleton_Wall_Skull006_1"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull006_1.geometry}
              material={materials['pumpkin_side.005']}
            />
            <mesh
              name="Skeleton_Wall_Skull006_2"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull006_2.geometry}
              material={materials['carved_pumpkin.005']}
            />
          </group>
          <group
            name="pumpkin_top009"
            position={[131.482, -189.532, 534.702]}
            rotation={[Math.PI / 2, 0, 2.916]}>
            <mesh
              name="Skeleton_Wall_Skull007"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull007.geometry}
              material={materials['pumpkin_top.005']}
            />
            <mesh
              name="Skeleton_Wall_Skull007_1"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull007_1.geometry}
              material={materials['pumpkin_side.005']}
            />
            <mesh
              name="Skeleton_Wall_Skull007_2"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull007_2.geometry}
              material={materials['carved_pumpkin.005']}
            />
          </group>
          <group
            name="pumpkin_top010"
            position={[127.36, -189.056, 427.178]}
            rotation={[Math.PI / 2, 0, 0.223]}>
            <mesh
              name="Skeleton_Skull004"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Skull004.geometry}
              material={materials['pumpkin_top.005']}
            />
            <mesh
              name="Skeleton_Skull004_1"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Skull004_1.geometry}
              material={materials['pumpkin_side.005']}
            />
            <mesh
              name="Skeleton_Skull004_2"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Skull004_2.geometry}
              material={materials['carved_pumpkin.005']}
            />
          </group>
          <group
            name="rail_corner001"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="red_concrete002"
            castShadow
            receiveShadow
            geometry={nodes.red_concrete002.geometry}
            material={materials['red_concrete.003']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="red_nether_bricks003"
            castShadow
            receiveShadow
            geometry={nodes.red_nether_bricks003.geometry}
            material={materials['red_nether_bricks.003']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="red_nether_bricks004"
            castShadow
            receiveShadow
            geometry={nodes.red_nether_bricks004.geometry}
            material={materials['red_nether_bricks.003']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="red_wool002"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="red_wool003"
            castShadow
            receiveShadow
            geometry={nodes.red_wool003.geometry}
            material={materials['red_wool.002']}
            position={[126.256, -189.756, 432.054]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <mesh
            name="sandstone006"
            castShadow
            receiveShadow
            geometry={nodes.sandstone006.geometry}
            material={materials['sandstone.006']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="sandstone_top016"
            castShadow
            receiveShadow
            geometry={nodes.sandstone_top016.geometry}
            material={materials['sandstone_top.004']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="spruce_planks027"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="spruce_planks028"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="spruce_planks029"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="spruce_planks030"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks030.geometry}
            material={materials['spruce_planks.009']}
            position={[126.21, -189.15, 429.993]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <mesh
            name="spruce_planks031"
            castShadow
            receiveShadow
            geometry={nodes.spruce_planks031.geometry}
            material={materials['spruce_planks.009']}
            position={[125.842, -188.306, 433.883]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <group
            name="spruce_trapdoor004"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="spruce_trapdoor005"
            castShadow
            receiveShadow
            geometry={nodes.spruce_trapdoor005.geometry}
            material={materials['spruce_trapdoor.003']}
            position={[126.367, -187.712, 431.567]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <mesh
            name="stone027"
            castShadow
            receiveShadow
            geometry={nodes.stone027.geometry}
            material={materials['stone.007']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="stone028"
            castShadow
            receiveShadow
            geometry={nodes.stone028.geometry}
            material={materials['stone.007']}
            position={[129.233, -190.282, 531.883]}
            rotation={[Math.PI / 2, 0, 2.916]}
          />
          <mesh
            name="stripped_birch_log006"
            castShadow
            receiveShadow
            geometry={nodes.stripped_birch_log006.geometry}
            material={materials['stripped_birch_log.004']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="stripped_crimson_stem"
            castShadow
            receiveShadow
            geometry={nodes.stripped_crimson_stem.geometry}
            material={materials.stripped_crimson_stem}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="stripped_crimson_stem001"
            castShadow
            receiveShadow
            geometry={nodes.stripped_crimson_stem001.geometry}
            material={materials.stripped_crimson_stem}
            position={[131.09, -189.282, 591.741]}
            rotation={[Math.PI / 2, 0, -0.21]}
          />
          <group
            name="stripped_warped_stem007"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="tripwire_hook007"
            castShadow
            receiveShadow
            geometry={nodes.tripwire_hook007.geometry}
            material={materials['tripwire_hook.008']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="tripwire_hook009"
            castShadow
            receiveShadow
            geometry={nodes.tripwire_hook009.geometry}
            material={materials['tripwire_hook.008']}
            position={[126.898, -189.048, 429.544]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <group
            name="warped_trapdoor002"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="white_concrete001"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="white_concrete002"
            castShadow
            receiveShadow
            geometry={nodes.white_concrete002.geometry}
            material={materials['white_concrete.002']}
            position={[126.027, -188.79, 425.851]}
            rotation={[Math.PI / 2, 0, 0.223]}
          />
          <mesh
            name="white_stained_glass013"
            castShadow
            receiveShadow
            geometry={nodes.white_stained_glass013.geometry}
            material={materials['white_stained_glass.008']}
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group
            name="white_stained_glass014"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="White_Stained_Glass_Pane014"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane014.geometry}
              material={materials['white_stained_glass.008']}
            />
            <mesh
              name="White_Stained_Glass_Pane014_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane014_1.geometry}
              material={materials['white_stained_glass_pane_top.008']}
            />
          </group>
          <group
            name="white_stained_glass019"
            position={[130.868, -188.282, 532.021]}
            rotation={[Math.PI / 2, 0, 2.916]}>
            <mesh
              name="White_Stained_Glass_Pane015"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane015.geometry}
              material={materials['white_stained_glass.008']}
            />
            <mesh
              name="White_Stained_Glass_Pane015_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane015_1.geometry}
              material={materials['white_stained_glass_pane_top.008']}
            />
          </group>
          <group
            name="yellow_stained_glass002"
            position={[-1001.533, -191, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
        </group>
        <mesh
          name="flower"
          castShadow
          receiveShadow
          geometry={nodes.flower.geometry}
          material={materials.花瓣}
          position={[111.704, 0.214, 557.856]}
          rotation={[2.807, 0.773, -2.933]}
        />
        <mesh
          name="Sphere003"
          castShadow
          receiveShadow
          geometry={nodes.Sphere003.geometry}
          material={nodes.Sphere003.material}
          position={[111.821, 0.219, 566.911]}
          rotation={[-Math.PI, 1.544, 0]}
          scale={[-8.905, -0.303, -11.793]}
        />
        <mesh
          name="Sphere004"
          castShadow
          receiveShadow
          geometry={nodes.Sphere004.geometry}
          material={nodes.Sphere004.material}
          position={[111.275, -0.163, 602.773]}
          rotation={[-Math.PI, 1.544, 0]}
          scale={[-18.275, -0.357, -13.04]}
        />
        <mesh
          name="flower2002"
          castShadow
          receiveShadow
          geometry={nodes.flower2002.geometry}
          material={materials.花瓣}
          position={[118.558, 0.039, 564.927]}
          rotation={[-3.094, 0.491, 3.06]}
          scale={0.581}
        />
        <mesh
          name="flower2003"
          castShadow
          receiveShadow
          geometry={nodes.flower2003.geometry}
          material={materials.花瓣}
          position={[113.531, 0.518, 566.366]}
          rotation={[1.502, 1.083, 3.033]}
          scale={0.52}
        />
        <mesh
          name="flower2004"
          castShadow
          receiveShadow
          geometry={nodes.flower2004.geometry}
          material={materials.花瓣}
          position={[116.878, 0.281, 561.852]}
          rotation={[-2.576, 0.438, -2.642]}
          scale={0.606}
        />
        <mesh
          name="flower2005"
          castShadow
          receiveShadow
          geometry={nodes.flower2005.geometry}
          material={materials.花瓣}
          position={[117.564, 0.414, 561.689]}
          rotation={[1.948, 0.871, 2.187]}
          scale={0.524}
        />
        <mesh
          name="flower2006"
          castShadow
          receiveShadow
          geometry={nodes.flower2006.geometry}
          material={materials.花瓣}
          position={[110.035, 0.285, 558.394]}
          rotation={[-2.329, -0.085, -1.226]}
          scale={0.584}
        />
        <mesh
          name="flower2007"
          castShadow
          receiveShadow
          geometry={nodes.flower2007.geometry}
          material={materials.花瓣}
          position={[109.399, 0.281, 558.425]}
          rotation={[2.631, 0.459, 0.967]}
          scale={0.459}
        />
        <mesh
          name="flower2008"
          castShadow
          receiveShadow
          geometry={nodes.flower2008.geometry}
          material={materials.花瓣}
          position={[108.588, 0.253, 558.525]}
          rotation={[-2.406, -0.039, -0.818]}
          scale={0.446}
        />
        <mesh
          name="flower2009"
          castShadow
          receiveShadow
          geometry={nodes.flower2009.geometry}
          material={materials.花瓣}
          position={[110.806, 0.518, 565.759]}
          rotation={[-3.009, 0.154, 0.493]}
          scale={0.647}
        />
        <mesh
          name="flower2010"
          castShadow
          receiveShadow
          geometry={nodes.flower2010.geometry}
          material={materials.花瓣}
          position={[106.081, 0.059, 563.924]}
          rotation={[-3.068, -0.51, 0.036]}
          scale={0.586}
        />
        <mesh
          name="flower2011"
          castShadow
          receiveShadow
          geometry={nodes.flower2011.geometry}
          material={materials.花瓣}
          position={[106.929, 0.054, 567.858]}
          rotation={[-3.022, -0.996, 0.1]}
          scale={0.531}
        />
        <mesh
          name="flower2012"
          castShadow
          receiveShadow
          geometry={nodes.flower2012.geometry}
          material={materials.花瓣}
          position={[113.492, 0.06, 568.722]}
          rotation={[-2.948, -1.228, 0.183]}
          scale={0.597}
        />
        <mesh
          name="flower2013"
          castShadow
          receiveShadow
          geometry={nodes.flower2013.geometry}
          material={materials.花瓣}
          position={[107.573, 0.281, 575.056]}
          rotation={[0.461, 0.071, -0.351]}
          scale={0.62}
        />
        <mesh
          name="flower2014"
          castShadow
          receiveShadow
          geometry={nodes.flower2014.geometry}
          material={materials.花瓣}
          position={[113.848, 0.455, 572.165]}
          rotation={[0.847, 0.667, -1.301]}
          scale={0.544}
        />
        <mesh
          name="flower2015"
          castShadow
          receiveShadow
          geometry={nodes.flower2015.geometry}
          material={materials.花瓣}
          position={[115.532, 0.341, 574.471]}
          rotation={[-0.607, 1.105, 0.997]}
          scale={0.419}
        />
        <mesh
          name="flower2016"
          castShadow
          receiveShadow
          geometry={nodes.flower2016.geometry}
          material={materials.花瓣}
          position={[114.307, 0.035, 574.001]}
          rotation={[0.149, 1.385, -0.12]}
          scale={0.498}
        />
        <mesh
          name="flower2017"
          castShadow
          receiveShadow
          geometry={nodes.flower2017.geometry}
          material={materials.花瓣}
          position={[116.655, 0.048, 572.453]}
          rotation={[-0.067, 0.28, -3.123]}
          scale={0.463}
        />
        <mesh
          name="flower2018"
          castShadow
          receiveShadow
          geometry={nodes.flower2018.geometry}
          material={materials.花瓣}
          position={[116.429, 0.047, 571.593]}
          rotation={[-2.936, 1.218, 2.735]}
          scale={0.638}
        />
        <mesh
          name="flower2019"
          castShadow
          receiveShadow
          geometry={nodes.flower2019.geometry}
          material={materials.花瓣}
          position={[118.455, 0.045, 569.977]}
          rotation={[-2.989, 1.218, 2.703]}
          scale={0.604}
        />
        <mesh
          name="flower2020"
          castShadow
          receiveShadow
          geometry={nodes.flower2020.geometry}
          material={materials.花瓣}
          position={[113.428, 0.086, 569.742]}
          rotation={[-0.176, 0.384, -3.077]}
          scale={0.65}
        />
        <mesh
          name="flower2021"
          castShadow
          receiveShadow
          geometry={nodes.flower2021.geometry}
          material={materials.花瓣}
          position={[119.188, 0.053, 569.035]}
          rotation={[-0.109, 0.937, -3.053]}
          scale={0.518}
        />
        <mesh
          name="DP+_Leaf002"
          castShadow
          receiveShadow
          geometry={nodes['DP+_Leaf002'].geometry}
          material={materials.cherry_0}
          position={[119.054, -12.339, 475.689]}
          rotation={[0, 0, -Math.PI]}
          scale={[-11.767, -11.767, -11.594]}
        />
        <mesh
          name="DP+_Leaf003"
          castShadow
          receiveShadow
          geometry={nodes['DP+_Leaf003'].geometry}
          material={materials.cherry_0}
          position={[119.054, -5.769, 475.618]}
          rotation={[0, 0, -Math.PI]}
          scale={[-11.767, -11.767, -11.594]}
        />
        <mesh
          name="DP+_Leaf004"
          castShadow
          receiveShadow
          geometry={nodes['DP+_Leaf004'].geometry}
          material={materials.cherry_0}
          position={[119.054, -5.769, 358.439]}
          rotation={[0, 0, -Math.PI]}
          scale={[-11.767, -11.767, -11.594]}
        />
        <group name="Vortex" position={[121.174, 0.021, 622.279]} scale={[1, 1, 0.921]} />
        <group name="Wind" position={[121.174, 0.021, 627.897]} />
        <mesh
          name="DP+_Leaf005"
          castShadow
          receiveShadow
          geometry={nodes['DP+_Leaf005'].geometry}
          material={materials.cherry_0}
          position={[119.054, -4.919, 540.23]}
          rotation={[0, 0, -Math.PI]}
          scale={[-11.767, -11.767, -11.594]}
        />
        <group name="Empty" position={[111.765, 1.604, 668.611]}>
          <mesh
            name="birch_planks051"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks051.geometry}
            material={materials['birch_planks.010']}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="birch_planks052"
            castShadow
            receiveShadow
            geometry={nodes.birch_planks052.geometry}
            material={materials['birch_planks.010']}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="brown_wool003"
            castShadow
            receiveShadow
            geometry={nodes.brown_wool003.geometry}
            material={materials['brown_wool.002']}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="collision_car"
            castShadow
            receiveShadow
            geometry={nodes.collision_car.geometry}
            material={nodes.collision_car.material}
            position={[-0.16, -3.313, 8.08]}
            rotation={[0.089, 0, 0]}
            scale={4.105}
          />
          <mesh
            name="dark_oak_planks032"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks032.geometry}
            material={materials['dark_oak_planks.008']}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dark_oak_planks033"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks033.geometry}
            material={materials['dark_oak_planks.008']}
            position={[0.062, -0.613, 4.564]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dark_oak_planks034"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_planks034.geometry}
            material={materials['dark_oak_planks.008']}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dark_oak_trapdoor005"
            castShadow
            receiveShadow
            geometry={nodes.dark_oak_trapdoor005.geometry}
            material={materials['dark_oak_trapdoor.004']}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="dead_tube_coral_fan018"
            castShadow
            receiveShadow
            geometry={nodes.dead_tube_coral_fan018.geometry}
            material={materials['dead_tube_coral_fan.008']}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="deepslate_tiles026"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles026.geometry}
            material={materials['deepslate_tiles.010']}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="deepslate_tiles027"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles027.geometry}
            material={materials['deepslate_tiles.010']}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="deepslate_tiles028"
            castShadow
            receiveShadow
            geometry={nodes.deepslate_tiles028.geometry}
            material={materials['deepslate_tiles.010']}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="gray_concrete005"
            castShadow
            receiveShadow
            geometry={nodes.gray_concrete005.geometry}
            material={materials['gray_concrete.004']}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="iron_bars011"
            castShadow
            receiveShadow
            geometry={nodes.iron_bars011.geometry}
            material={materials['iron_bars.008']}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="jungle_planks006"
            castShadow
            receiveShadow
            geometry={nodes.jungle_planks006.geometry}
            material={materials['jungle_planks.004']}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="light_gray_wool007"
            castShadow
            receiveShadow
            geometry={nodes.light_gray_wool007.geometry}
            material={materials['light_gray_wool.005']}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="mangrove_planks014"
            castShadow
            receiveShadow
            geometry={nodes.mangrove_planks014.geometry}
            material={materials['mangrove_planks.005']}
            position={[0.017, -0.562, 5.052]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[0.827, 1, 1]}
          />
          <mesh
            name="nether_bricks005"
            castShadow
            receiveShadow
            geometry={nodes.nether_bricks005.geometry}
            material={materials['nether_bricks.002']}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="oak_trapdoor012"
            castShadow
            receiveShadow
            geometry={nodes.oak_trapdoor012.geometry}
            material={materials['oak_trapdoor.008']}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="oak_trapdoor013"
            castShadow
            receiveShadow
            geometry={nodes.oak_trapdoor013.geometry}
            material={materials['oak_trapdoor.008']}
            position={[0, -1, 3.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="oak_trapdoor014"
            castShadow
            receiveShadow
            geometry={nodes.oak_trapdoor014.geometry}
            material={materials['oak_trapdoor.008']}
            position={[0, -1, -1.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="oak_trapdoor015"
            castShadow
            receiveShadow
            geometry={nodes.oak_trapdoor015.geometry}
            material={materials['oak_trapdoor.008']}
            position={[0, -1.11, 3.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="oak_trapdoor016"
            castShadow
            receiveShadow
            geometry={nodes.oak_trapdoor016.geometry}
            material={materials['oak_trapdoor.008']}
            position={[0, -1.11, -1.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            name="polished_deepslate018"
            castShadow
            receiveShadow
            geometry={nodes.polished_deepslate018.geometry}
            material={materials['polished_deepslate.008']}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group name="pumpkin_top011" rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="Skeleton_Wall_Skull004"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull004.geometry}
              material={materials['pumpkin_top.005']}
            />
            <mesh
              name="Skeleton_Wall_Skull004_1"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull004_1.geometry}
              material={materials['pumpkin_side.005']}
            />
            <mesh
              name="Skeleton_Wall_Skull004_2"
              castShadow
              receiveShadow
              geometry={nodes.Skeleton_Wall_Skull004_2.geometry}
              material={materials['carved_pumpkin.005']}
            />
          </group>
          <mesh
            name="stone029"
            castShadow
            receiveShadow
            geometry={nodes.stone029.geometry}
            material={materials['stone.007']}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <group name="white_stained_glass020" rotation={[Math.PI / 2, 0, 0]}>
            <mesh
              name="White_Stained_Glass_Pane008"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane008.geometry}
              material={materials['white_stained_glass.008']}
            />
            <mesh
              name="White_Stained_Glass_Pane008_1"
              castShadow
              receiveShadow
              geometry={nodes.White_Stained_Glass_Pane008_1.geometry}
              material={materials['white_stained_glass_pane_top.008']}
            />
          </group>
        </group>
        <group name="rotation" position={[111.765, 1.604, 593.655]} />
        <mesh
          name="big_smoke_0"
          castShadow
          receiveShadow
          geometry={nodes.big_smoke_0.geometry}
          material={materials.big_smoke_0}
          position={[111.828, -3.027, 592.092]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <group
          name="晶格"
          position={[64.347, 34.076, 336.95]}
          rotation={[0, 0.017, 0]}
          scale={17.61}
        />
        <mesh
          name="Plane"
          castShadow
          receiveShadow
          geometry={nodes.Plane.geometry}
          material={materials.water}
          position={[106.174, -0.004, 567.522]}
          rotation={[0, 0.102, 0]}
          scale={30}
        />
        <mesh
          name="Plane002"
          castShadow
          receiveShadow
          geometry={nodes.Plane002.geometry}
          material={materials.water}
          position={[117.575, -0.01, 458.927]}
          rotation={[0, 1.385, 0]}
          scale={30}
        />
        <mesh
          name="Plane003"
          castShadow
          receiveShadow
          geometry={nodes.Plane003.geometry}
          material={materials.water}
          position={[96.507, -0.01, 344.982]}
          rotation={[0, 1.385, 0]}
          scale={30}
        />
        <mesh
          name="Plane004"
          castShadow
          receiveShadow
          geometry={nodes.Plane004.geometry}
          material={materials.water}
          position={[96.483, 0.038, 650.27]}
          rotation={[0, 0.49, 0]}
          scale={30}
        />
        <mesh
          name="花瓣003"
          castShadow
          receiveShadow
          geometry={nodes.花瓣003.geometry}
          material={materials.花瓣}
          position={[121.262, 5.408, 630.834]}
          rotation={[2.799, -0.796, 2.862]}>
          <mesh
            name="Sphere001"
            castShadow
            receiveShadow
            geometry={nodes.Sphere001.geometry}
            material={nodes.Sphere001.material}
            position={[0.065, -0.01, 0.013]}
            rotation={[2.936, 0.832, 3.098]}
            scale={0.268}
          />
        </mesh>
        <mesh
          name="花瓣"
          castShadow
          receiveShadow
          geometry={nodes.花瓣.geometry}
          material={materials.花瓣}
          position={[118.237, 7.845, 626.889]}
          rotation={[2.807, 0.773, -2.933]}>
          <mesh
            name="Sphere"
            castShadow
            receiveShadow
            geometry={nodes.Sphere.geometry}
            material={nodes.Sphere.material}
            position={[0.012, 0.147, -0.022]}
            rotation={[2.874, -0.794, 3.1]}
            scale={0.268}
          />
        </mesh>
        <mesh
          name="Sphere002"
          castShadow
          receiveShadow
          geometry={nodes.Sphere002.geometry}
          material={nodes.Sphere002.material}
          position={[126.976, 4.294, 627.674]}
          scale={0.268}
        />
      </group>
    </group>
  )
} 
useGLTF.preload('/city.glb')
export default City;
