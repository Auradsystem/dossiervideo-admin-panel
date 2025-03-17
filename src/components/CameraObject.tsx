import React, { useEffect, useRef, useState } from 'react';
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
  
  // Références pour les dimensions et positions pendant la transformation
  const transformState = useRef({
    initialWidth: camera.width,
    initialHeight: camera.height,
    initialX: camera.x,
    initialY: camera.y,
    initialViewDistance: camera.viewDistance,
    initialRotation: camera.rotation || 0,
    scaleX: 1,
    scaleY: 1,
    x: camera.x,
    y: camera.y,
    rotation: camera.rotation || 0
  });
  
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
      updateLabelPosition();
    }
  }, [camera.x, camera.y, camera.width, camera.height, camera.rotation]);

  // Fonction pour mettre à jour la position du label
  const updateLabelPosition = () => {
    if (!labelRef.current) return;
    
    // Positionner le label au-dessus de la caméra
    labelRef.current.position({
      x: camera.x,
      y: camera.y - camera.height/2 - 20
    });
    
    // Mettre à jour la taille du texte
    const textNode = labelRef.current.findOne('Text');
    if (textNode) {
      textNode.fontSize(Math.max(10, Math.min(16, camera.width * 0.4)));
      textNode.width(camera.width * 2);
      textNode.offsetX(camera.width);
    }
    
    labelRef.current.getLayer()?.batchDraw();
  };

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

  const handleDragStart = () => {
    // Sauvegarder l'état initial pour le drag
    if (groupRef.current) {
      transformState.current.initialX = camera.x;
      transformState.current.initialY = camera.y;
    }
  };

  const handleDragMove = (e: any) => {
    // Mettre à jour la position du label pendant le drag
    if (labelRef.current) {
      labelRef.current.position({
        x: e.target.x(),
        y: e.target.y() - camera.height/2 - 20
      });
      labelRef.current.getLayer()?.batchDraw();
    }
  };

  const handleDragEnd = (e: any) => {
    const newX = e.target.x();
    const newY = e.target.y();
    
    updateCamera(camera.id, {
      x: newX,
      y: newY
    });
  };

  const handleTransformStart = () => {
    // Sauvegarder l'état initial pour la transformation
    if (groupRef.current) {
      const node = groupRef.current;
      
      transformState.current = {
        initialWidth: camera.width,
        initialHeight: camera.height,
        initialX: camera.x,
        initialY: camera.y,
        initialViewDistance: camera.viewDistance,
        initialRotation: camera.rotation || 0,
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        x: node.x(),
        y: node.y(),
        rotation: node.rotation()
      };
    }
  };

  const handleTransform = (e: any) => {
    // Obtenir le nœud transformé
    const node = e.target;
    
    // Calculer les nouvelles valeurs
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();
    const x = node.x();
    const y = node.y();
    
    // Mettre à jour l'état de transformation
    transformState.current.scaleX = scaleX;
    transformState.current.scaleY = scaleY;
    transformState.current.x = x;
    transformState.current.y = y;
    transformState.current.rotation = rotation;
    
    // Calculer les nouvelles dimensions
    const newWidth = transformState.current.initialWidth * scaleX;
    const newHeight = transformState.current.initialHeight * scaleY;
    
    // Mettre à jour la position du label en temps réel
    if (labelRef.current) {
      labelRef.current.position({
        x: x,
        y: y - (newHeight / 2) - 20
      });
      
      // Mettre à jour la taille du texte en temps réel
      const textNode = labelRef.current.findOne('Text');
      if (textNode) {
        textNode.fontSize(Math.max(10, Math.min(16, newWidth * 0.4)));
        textNode.width(newWidth * 2);
        textNode.offsetX(newWidth);
      }
      
      labelRef.current.getLayer()?.batchDraw();
    }
  };

  const handleTransformEnd = () => {
    const node = groupRef.current;
    if (!node) return;
    
    // Récupérer les valeurs finales
    const scaleX = transformState.current.scaleX;
    const scaleY = transformState.current.scaleY;
    const rotation = transformState.current.rotation;
    const x = transformState.current.x;
    const y = transformState.current.y;
    
    // Calculer les nouvelles dimensions
    const newWidth = Math.max(10, transformState.current.initialWidth * scaleX);
    const newHeight = Math.max(10, transformState.current.initialHeight * scaleY);
    const newViewDistance = transformState.current.initialViewDistance * scaleX;
    
    // Réinitialiser l'échelle
    node.scaleX(1);
    node.scaleY(1);
    
    // Mettre à jour la caméra avec les nouvelles valeurs
    updateCamera(camera.id, {
      x: x,
      y: y,
      width: newWidth,
      height: newHeight,
      viewDistance: newViewDistance,
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
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransformStart={handleTransformStart}
        onTransform={handleTransform}
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
