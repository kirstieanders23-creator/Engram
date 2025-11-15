import React, { useState } from 'react';
import { Modal, View, Image, TouchableOpacity, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import PropTypes from 'prop-types';

const { width, height } = Dimensions.get('window');

export const PhotoViewer = ({ visible, photos, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };
  const handleNext = () => {
    setCurrentIndex(prev => Math.min((photos || []).length - 1, prev + 1));
  };

  if (!photos || !photos.length) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: currentIndex * width, y: 0 }}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(idx);
          }}
        >
          {photos.map((uri, idx) => (
            <View key={`${uri}-${idx}`} style={styles.imageWrap}>
              <Image source={{ uri }} style={styles.image} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>

        <View style={styles.controls}>
          <TouchableOpacity onPress={handlePrev} disabled={currentIndex === 0}>
            <Text style={[styles.controlText, currentIndex === 0 && styles.controlDisabled]}>‹ Prev</Text>
          </TouchableOpacity>
          <Text style={styles.counter}>{currentIndex + 1} / {photos.length}</Text>
          <TouchableOpacity onPress={handleNext} disabled={currentIndex === photos.length - 1}>
            <Text style={[styles.controlText, currentIndex === photos.length - 1 && styles.controlDisabled]}>Next ›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

PhotoViewer.propTypes = {
  visible: PropTypes.bool.isRequired,
  photos: PropTypes.arrayOf(PropTypes.string),
  initialIndex: PropTypes.number,
  onClose: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000ee',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000088',
    borderRadius: 20,
  },
  closeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  imageWrap: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width * 0.9,
    height: height * 0.8,
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  controlDisabled: {
    opacity: 0.3,
  },
  counter: {
    color: '#fff',
    fontSize: 16,
  },
});
