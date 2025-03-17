import React, { useEffect, useRef } from 'react';
import { Group, Circle, Wedge, Text, Transformer, Path, Label, Tag } from 'react-konva';
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
  const labelRef = useRef<any>(null);
  
  // Effet pour mettre à jour le transformer quand la caméra est sélectionnée
  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // Effet pour repositionner le label après rotation ou redimensionnement
  useEffect(() => {
    if (labelRef.current) {
      // Positionner le label au-dessus de la caméra, indépendamment de la rotation
      labelRef.current.position({
        x: camera.x,
        y: camera.y - camera.height/2 - 20
      });
    }
  }, [camera.x, camera.y, camera.width, camera.height, camera.rotation]);

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
    const newX = e.target.x();
    const newY = e.target.y();
    
    updateCamera(camera.id, {
      x: newX,
      y: newY
    });
  };

  const handleTransformEnd = (e: any) => {
    const node = groupRef.current;
    if (!node) return;
    
    // Récupérer les valeurs actuelles
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();
    
    // Calculer les nouvelles dimensions
    const newWidth = Math.max(10, camera.width * scaleX);
    const newHeight = Math.max(10, camera.height * scaleY);
    
    // Réinitialiser l'échelle mais conserver la rotation et la position
    node.scaleX(1);
    node.scaleY(1);
    
    // Mettre à jour la caméra avec les nouvelles valeurs
    updateCamera(camera.id, {
      x: node.x(),
      y: node.y(),
      width: newWidth,
      height: newHeight,
      viewDistance: camera.viewDistance * scaleX, // Proportionnel à l'échelle
      rotation: rotation
    });
  };

  // Calculer la taille du texte proportionnelle à la caméra
  const fontSize = Math.max(10, Math.min(16, camera.width * 0.4));

  return (
    <>
      {/* Groupe principal pour la caméra et son champ de vision */}
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
        {/* Champ de vision */}
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
        
        {/* Icône de caméra */}
        {getCameraIcon()}
      </Group>
      
      {/* Label séparé pour le texte - toujours horizontal */}
      <Label
        ref={labelRef}
        x={camera.x}
        y={camera.y - camera.height/2 - 20}
        onClick={() => setSelectedCamera(camera.id)}
        onTap={() => setSelectedCamera(camera.id)}
      >
        <Tag
          fill="transparent"
          pointerDirection="down"
          pointerWidth={10}
          pointerHeight={10}
          lineJoin="round"
        />
        <Text
          text={camera.name}
          fontSize={fontSize}
          fill="#000"
          padding={2}
          align="center"
          width={camera.width * 2}
          offsetX={camera.width}
        />
      </Label>
      
      {/* Transformer pour redimensionner et faire pivoter la caméra */}
      {isSelected && (
        <Transformer
          ref={transformerRef}
          keepRatio={true}
          rotateEnabled={true}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox, newBox) => {
            // Limiter la taille min/max
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
