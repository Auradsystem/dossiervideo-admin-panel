import React, { useEffect, useRef } from 'react';
import { Group, Circle, Wedge, Text, Transformer, Path } from 'react-konva';
import { Camera, cameraIcons } from '../types/Camera';
import { useAppContext } from '../context/AppContext';

interface CameraObjectProps {
  camera: Camera;
}

const CameraObject: React.FC<CameraObjectProps> = ({ camera }) => {
  const { 
    selectedCamera, 
    setSelectedCamera, 
    updateCamera 
  } = useAppContext();
  
  const isSelected = selectedCamera === camera.id;
  const transformerRef = useRef<any>(null);
  const groupRef = useRef<any>(null);
  const textRef = useRef<any>(null);
  
  // Effet pour mettre à jour le transformer quand la caméra est sélectionnée
  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // Effet pour maintenir le texte horizontal même quand le groupe est transformé
  useEffect(() => {
    if (textRef.current && groupRef.current) {
      // Annuler la rotation du groupe pour le texte
      const groupRotation = groupRef.current.rotation() || 0;
      textRef.current.rotation(-groupRotation);
    }
  }, [camera.rotation]);

  const getCameraIcon = () => {
    const scale = camera.width / 24; // Scale factor based on camera width
    
    // Utiliser l'icône personnalisée si disponible
    if (camera.iconPath) {
      return (
        <Path
          data={camera.iconPath}
          fill="#ffffff"
          scaleX={scale}
          scaleY={scale}
          offsetX={12}
          offsetY={12}
        />
      );
    }
    
    // Sinon, utiliser l'icône prédéfinie pour le type de caméra
    const iconData = cameraIcons[camera.type] || cameraIcons.dome;
    
    return (
      <>
        <Circle
          radius={camera.width / 2}
          fill={iconData.color}
          stroke="#000"
          strokeWidth={1}
          opacity={0.9}
        />
        <Path
          data={iconData.path}
          fill="#ffffff"
          scaleX={scale}
          scaleY={scale}
          offsetX={12}
          offsetY={12}
        />
      </>
    );
  };

  const handleDragEnd = (e: any) => {
    updateCamera(camera.id, {
      x: e.target.x(),
      y: e.target.y()
    });
  };

  const handleTransformEnd = (e: any) => {
    const node = groupRef.current;
    const scaleX = node.scaleX();
    const rotation = node.rotation();
    
    // Reset scale but keep rotation
    node.scaleX(1);
    node.scaleY(1);
    
    const newWidth = Math.max(5, camera.width * scaleX);
    const newHeight = newWidth; // Garder la caméra carrée
    
    updateCamera(camera.id, {
      x: node.x(),
      y: node.y(),
      width: newWidth,
      height: newHeight,
      viewDistance: camera.viewDistance * scaleX, // Mettre à jour la distance de vue proportionnellement
      rotation: rotation
    });
  };

  // Calculer la taille du texte proportionnelle à la caméra
  const fontSize = Math.max(10, Math.min(16, camera.width * 0.4));

  return (
    <>
      {/* Camera group with icon, view angle, and text */}
      <Group
        ref={groupRef}
        x={camera.x}
        y={camera.y}
        draggable
        rotation={camera.rotation || 0}
        onClick={() => setSelectedCamera(camera.id)}
        onTap={() => setSelectedCamera(camera.id)}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      >
        {/* Camera view angle */}
        <Wedge
          x={0}
          y={0}
          radius={camera.viewDistance}
          angle={camera.angle}
          fill="rgba(255, 0, 0, 0.3)"
          stroke="rgba(255, 0, 0, 0.6)"
          strokeWidth={1}
          rotation={-camera.angle / 2}
          opacity={camera.opacity}
        />
        
        {/* Camera icon */}
        {getCameraIcon()}
        
        {/* Camera label - inside the group but with counter-rotation to stay horizontal */}
        <Text
          ref={textRef}
          text={camera.name}
          fontSize={fontSize}
          fill="#000"
          x={0}
          y={-camera.height / 2 - fontSize - 5}
          align="center"
          width={camera.width * 2}
          offsetX={camera.width}
          rotation={-(camera.rotation || 0)} // Counter-rotation pour rester horizontal
        />
      </Group>
      
      {isSelected && (
        <Transformer
          ref={transformerRef}
          keepRatio={true}
          rotateEnabled={true}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size to 10px and maximum to 100px for better control on small plans
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            if (newBox.width > 100 || newBox.height > 100) {
              return {
                ...newBox,
                width: Math.min(newBox.width, 100),
                height: Math.min(newBox.height, 100)
              };
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default CameraObject;
