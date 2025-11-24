import { BarCodeScanner } from "expo-barcode-scanner";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Button, Image, StyleSheet, Text, View } from "react-native";
import Tesseract from "tesseract.js";

export default function PhotoOCRBarcodeScreen() {
  const [image, setImage] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [barcode, setBarcode] = useState("");
  const [scanned, setScanned] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.cancelled) {
      setImage(result.uri);
      const text = await Tesseract.recognize(result.uri, "eng");
      setOcrText(text.data.text);
    }
  };

  const handleBarCodeScanned = ({ data }) => {
    setBarcode(data);
    setScanned(true);
  };

  return (
    <View style={styles.container}>
      <Button title="Pick an image for OCR" onPress={pickImage} />
      {image && <Image source={{ uri: image }} style={styles.image} />}
      {ocrText ? <Text>OCR Result: {ocrText}</Text> : null}
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={styles.barcode}
      />
      {barcode ? <Text>Barcode: {barcode}</Text> : null}
      {scanned && (
        <Button title="Scan Again" onPress={() => setScanned(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 16,
    borderRadius: 12,
  },
  barcode: {
    width: 300,
    height: 100,
    marginVertical: 16,
  },
});
