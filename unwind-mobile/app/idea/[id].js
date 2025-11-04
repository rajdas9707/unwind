import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Linking,
  Image,
  Alert,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getIdeaById, updateIdea, deleteIdea } from "../../storage/idea/db";
import { deleteFile as deleteStoredFile, saveFiles } from "../../storage/idea/storage";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import NewIdeaModal from "../../components/idea/NewIdeaModal";
import FileViewer from "../../components/shared/FileViewer";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function IdeaDetail() {
  const { id } = useLocalSearchParams();
  const [idea, setIdea] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  
  // Modal states
  const [topicModalVisible, setTopicModalVisible] = useState(false);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [learningModalVisible, setLearningModalVisible] = useState(false);
  const [editingLearningIndex, setEditingLearningIndex] = useState(null);
  const [newTopic, setNewTopic] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newLearning, setNewLearning] = useState("");
  
  const router = useRouter();

  const load = async () => {
    try {
      const row = await getIdeaById(Number(id));
      setIdea(row);
    } catch (error) {
      console.log("error loading idea detail", error);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const removeFile = async (index) => {
    try {
      const fileUri = idea.files[index];
      await deleteStoredFile(fileUri);
      const nextFiles = idea.files.filter((_, i) => i !== index);
      // import { AuthContext } from "../../context/AuthProvider";
      setIdea({ ...idea, files: nextFiles });
    } catch (error) {
      console.log("error removing file", error);
      Alert.alert("Error", "Failed to remove file");
    }
  };

  const handleEditIdea = () => {
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    setEditModalVisible(false);
    load(); // Reload the idea to show updated data
  };

  const handleDeleteIdea = async () => {
    Alert.alert(
      "Delete Idea",
      "Are you sure you want to delete this idea? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete all associated files first
              if (idea.files && idea.files.length > 0) {
                for (const fileUri of idea.files) {
                  await deleteStoredFile(fileUri);
                }
              }

              // Delete the idea from database
              await deleteIdea(idea.id);

              // Navigate back to ideas list
              router.back();
            } catch (error) {
              console.log("Error deleting idea:", error);
              Alert.alert("Error", "Failed to delete idea");
            }
          },
        },
      ]
    );
  };

  const handleFilePress = (index) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

  // Add Research Topic
  const handleAddTopic = async () => {
    if (!newTopic.trim()) return;
    
    try {
      const topics = idea.researchTopics || [];
      const updatedTopics = [...topics, newTopic.trim()];
      
      await updateIdea({
        ...idea,
        researchTopics: updatedTopics,
      });
      
      setIdea({ ...idea, researchTopics: updatedTopics });
      setNewTopic("");
      setTopicModalVisible(false);
    } catch (error) {
      console.log("Error adding topic:", error);
      Alert.alert("Error", "Failed to add topic");
    }
  };

  // Remove Research Topic
  const handleRemoveTopic = async (index) => {
    try {
      const topics = idea.researchTopics || [];
      const updatedTopics = topics.filter((_, i) => i !== index);
      
      await updateIdea({
        ...idea,
        researchTopics: updatedTopics,
      });
      
      setIdea({ ...idea, researchTopics: updatedTopics });
    } catch (error) {
      console.log("Error removing topic:", error);
      Alert.alert("Error", "Failed to remove topic");
    }
  };

  // Add Link
  const handleAddLink = async () => {
    if (!newLink.trim()) return;
    
    try {
      const urls = idea.urls || [];
      const updatedUrls = [...urls, newLink.trim()];
      
      await updateIdea({
        ...idea,
        urls: updatedUrls,
      });
      
      setIdea({ ...idea, urls: updatedUrls });
      setNewLink("");
      setLinkModalVisible(false);
    } catch (error) {
      console.log("Error adding link:", error);
      Alert.alert("Error", "Failed to add link");
    }
  };

  // Remove Link
  const handleRemoveLink = async (index) => {
    try {
      const urls = idea.urls || [];
      const updatedUrls = urls.filter((_, i) => i !== index);
      
      await updateIdea({
        ...idea,
        urls: updatedUrls,
      });
      
      setIdea({ ...idea, urls: updatedUrls });
    } catch (error) {
      console.log("Error removing link:", error);
      Alert.alert("Error", "Failed to remove link");
    }
  };

  // Add Files
  const handlePickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        multiple: true,
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const validFiles = result.assets.filter((file) => {
          if (file.size && file.size > MAX_FILE_SIZE) {
            Alert.alert(
              "File Too Large",
              `${file.name || "A file"} exceeds 10 MB and was skipped.`
            );
            return false;
          }
          return true;
        });

        if (validFiles.length > 0) {
          const savedUris = await saveFiles({
            files: validFiles,
            fileLabel: "idea",
            ideaId: idea.id,
          });
          
          const updatedFiles = [...(idea.files || []), ...savedUris];
          
          await updateIdea({
            ...idea,
            files: updatedFiles,
          });
          
          setIdea({ ...idea, files: updatedFiles });
        }
      }
    } catch (error) {
      console.log("Error picking files:", error);
      Alert.alert("Error", "Failed to add files");
    }
  };

  // Take Photo
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Camera permission is required.");
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const savedUris = await saveFiles({
          files: result.assets,
          fileLabel: "idea",
          ideaId: idea.id,
        });
        
        const updatedFiles = [...(idea.files || []), ...savedUris];
        
        await updateIdea({
          ...idea,
          files: updatedFiles,
        });
        
        setIdea({ ...idea, files: updatedFiles });
      }
    } catch (error) {
      console.log("Error taking photo:", error);
      Alert.alert("Error", "Failed to add photo");
    }
  };

  // Add or Edit Learning
  const handleAddLearning = async () => {
    if (!newLearning.trim()) return;
    
    try {
      const learnings = idea.learnings || [];
      let updatedLearnings;
      
      if (editingLearningIndex !== null) {
        // Edit existing learning
        updatedLearnings = learnings.map((learning, index) => 
          index === editingLearningIndex 
            ? { ...learning, text: newLearning.trim(), editedDate: new Date().toISOString() }
            : learning
        );
      } else {
        // Add new learning
        updatedLearnings = [...learnings, { text: newLearning.trim(), date: new Date().toISOString() }];
      }
      
      await updateIdea({
        ...idea,
        learnings: updatedLearnings,
      });
      
      setIdea({ ...idea, learnings: updatedLearnings });
      setNewLearning("");
      setEditingLearningIndex(null);
      setLearningModalVisible(false);
    } catch (error) {
      console.log("Error saving learning:", error);
      Alert.alert("Error", "Failed to save learning");
    }
  };

  // Open Edit Learning Modal
  const handleEditLearning = (index) => {
    const learning = idea.learnings[index];
    setNewLearning(learning.text);
    setEditingLearningIndex(index);
    setLearningModalVisible(true);
  };

  // Remove Learning
  const handleRemoveLearning = async (index) => {
    try {
      const learnings = idea.learnings || [];
      const updatedLearnings = learnings.filter((_, i) => i !== index);
      
      await updateIdea({
        ...idea,
        learnings: updatedLearnings,
      });
      
      setIdea({ ...idea, learnings: updatedLearnings });
    } catch (error) {
      console.log("Error removing learning:", error);
      Alert.alert("Error", "Failed to remove learning");
    }
  };

  if (!idea) return null;

  return (
    <LinearGradient
      colors={['#F8FAFC', '#F1F5F9', '#EEF2FF']}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
       
        <View style={styles.header}>
           <View style={styles.headerLeft}>
<TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.ideaInfo}>
            <Text style={styles.ideaTitle}>
              {idea.name || "Untitled Idea"}
            </Text>
            <View style={styles.categoryContainer}>
              <Ionicons name="pricetag" size={14} color="#6366F1" />
              <Text style={styles.categoryText}>
                {idea.tag || "miscellaneous"}
              </Text>
            </View>
          </View>
        </View>
          
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleEditIdea}
              style={styles.editButton}
            >
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteIdea}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Idea Info Card */}
          {/* <View style={styles.ideaCard}>
            <View style={styles.ideaHeader}>
              <View style={styles.ideaIcon}>
                <Ionicons name="bulb" size={28} color="#F59E0B" />
              </View>
              <View style={styles.ideaInfo}>
                <Text style={styles.ideaTitle}>
                  {idea.name || "Untitled Idea"}
      </Text>
                <View style={styles.categoryContainer}>
                  <Ionicons name="pricetag" size={14} color="#6366F1" />
                  <Text style={styles.categoryText}>
        {idea.tag || "miscellaneous"}
      </Text>
                </View>
              </View>
            </View>
          </View> */}

          {/* Description Section */}
          {idea.idea && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text-outline" size={20} color="#6366F1" />
                <Text style={styles.sectionTitle}>Description</Text>
              </View>
              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionText}>
                  {idea.idea}
                </Text>
              </View>
            </View>
          )}

          {/* Research Topics Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderWithAction}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
                <Text style={styles.sectionTitle}>Research Topics</Text>
              </View>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setTopicModalVisible(true)}
              >
                <Ionicons name="add" size={20} color="#F59E0B" />
              </TouchableOpacity>
            </View>
            {idea.researchTopics && idea.researchTopics.length > 0 ? (
              <View style={styles.topicsList}>
                {idea.researchTopics.map((topic, index) => (
                  <View key={`topic-${index}`} style={styles.topicItem}>
                    <View style={styles.topicDot} />
                    <Text style={styles.topicText}>{topic}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveTopic(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close-circle" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptySection}>
                <Text style={styles.emptyText}>No research topics yet</Text>
              </View>
            )}
          </View>

          {/* Links Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderWithAction}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="link" size={20} color="#10B981" />
                <Text style={styles.sectionTitle}>Links</Text>
              </View>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setLinkModalVisible(true)}
              >
                <Ionicons name="add" size={20} color="#10B981" />
              </TouchableOpacity>
            </View>
            {idea.urls && idea.urls.length > 0 ? (
              <View style={styles.urlsList}>
                {idea.urls.map((url, index) => {
                  const handleUrlPress = async () => {
                    try {
                      // First try with https://
                      let formattedUrl = url.startsWith('http://') || url.startsWith('https://')
                        ? url
                        : `https://${url}`;

                      const canOpen = await Linking.canOpenURL(formattedUrl);
                      if (canOpen) {
                        await Linking.openURL(formattedUrl);
                      } else {
                        // Try with http:// if https:// fails
                        formattedUrl = url.startsWith('http://') || url.startsWith('https://')
                          ? url
                          : `http://${url}`;

                        const canOpenHttp = await Linking.canOpenURL(formattedUrl);
                        if (canOpenHttp) {
                          await Linking.openURL(formattedUrl);
                        } else {
                          // As last resort, try to search for it
                          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
                          await Linking.openURL(searchUrl);
                        }
                      }
                    } catch (error) {
                      console.log('Error opening URL:', error);
                      // Fallback: search on Google
                      try {
                        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
                        await Linking.openURL(searchUrl);
                      } catch (fallbackError) {
                        console.log('Fallback search also failed:', fallbackError);
                        Alert.alert('Error', 'Unable to open URL or search for it');
                      }
                    }
                  };

                  return (
                    <TouchableOpacity
                      key={`${url}-${index}`}
                      onPress={handleUrlPress}
                      style={styles.urlItem}
                      activeOpacity={0.7}
                    >
                      <View style={styles.urlIcon}>
                        <Ionicons name="link" size={16} color="#10B981" />
                      </View>
                      <Text style={styles.urlText} numberOfLines={1}>
                        {url}
                      </Text>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemoveLink(index);
                        }}
                        style={styles.removeButton}
                      >
                        <Ionicons name="close-circle" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptySection}>
                <Text style={styles.emptyText}>No links yet</Text>
              </View>
            )}
          </View>

          {/* Files Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderWithAction}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="folder" size={20} color="#8B5CF6" />
                <Text style={styles.sectionTitle}>Files</Text>
              </View>
              <View style={styles.fileActions}>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={handleTakePhoto}
                >
                  <Ionicons name="camera" size={20} color="#8B5CF6" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={handlePickFiles}
                >
                  <Ionicons name="add" size={20} color="#8B5CF6" />
                </TouchableOpacity>
              </View>
            </View>
            {idea.files && idea.files.length > 0 ? (
              <View style={styles.filesList}>
                {idea.files.map((file, index) => {
                  const uri = file;
                  const fileName = uri.split('/').pop() || `File ${index + 1}`;
                  const isPdf = typeof uri === "string" && uri.toLowerCase().endsWith(".pdf");
                  const isImage = !isPdf && (uri.includes("image") || uri.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i));

                  return (
                    <TouchableOpacity
                      key={`${uri}-${index}`}
                      style={styles.fileItem}
                      onPress={() => handleFilePress(index)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.fileIconContainer}>
                        {isPdf ? (
                          <Ionicons name="document-text-outline" size={24} color="#8B5CF6" />
                        ) : isImage ? (
                          <Image source={{ uri }} style={styles.fileThumbnail} />
                        ) : (
                          <Ionicons name="document-outline" size={24} color="#8B5CF6" />
                        )}
                      </View>
                      <View style={styles.fileInfo}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {fileName}
                        </Text>
                        <Text style={styles.fileType}>
                          {isPdf ? 'PDF' : isImage ? 'Image' : 'File'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeFile(index)}
                        style={styles.removeButton}
                      >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptySection}>
                <Text style={styles.emptyText}>No files yet</Text>
              </View>
            )}
          </View>

          {/* Learnings Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderWithAction}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="school-outline" size={20} color="#3B82F6" />
                <Text style={styles.sectionTitle}>Learnings</Text>
              </View>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setLearningModalVisible(true)}
              >
                <Ionicons name="add" size={20} color="#3B82F6" />
              </TouchableOpacity>
            </View>
            {idea.learnings && idea.learnings.length > 0 ? (
              <View style={styles.learningsList}>
                {idea.learnings.map((learning, index) => (
                  <View key={`learning-${index}`} style={styles.learningItem}>
                    <TouchableOpacity 
                      style={styles.learningContent}
                      onPress={() => handleEditLearning(index)}
                    >
                      <Text style={styles.learningText}>{learning.text}</Text>
                      <Text style={styles.learningDate}>
                        {learning.editedDate ? 'Edited ' : ''}
                        {new Date(learning.editedDate || learning.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRemoveLearning(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close-circle" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptySection}>
                <Text style={styles.emptyText}>No learnings yet</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Add Topic Modal */}
        <Modal
          animationType="fade"
          transparent
          visible={topicModalVisible}
          onRequestClose={() => setTopicModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Add Research Topic</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter research topic..."
                value={newTopic}
                onChangeText={setNewTopic}
                autoFocus
                multiline
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setNewTopic("");
                    setTopicModalVisible(false);
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSaveButton, { backgroundColor: "#F59E0B" }]}
                  onPress={handleAddTopic}
                  disabled={!newTopic.trim()}
                >
                  <Text style={styles.modalSaveText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Link Modal */}
        <Modal
          animationType="fade"
          transparent
          visible={linkModalVisible}
          onRequestClose={() => setLinkModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Add Link</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter URL..."
                value={newLink}
                onChangeText={setNewLink}
                autoFocus
                keyboardType="url"
                autoCapitalize="none"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setNewLink("");
                    setLinkModalVisible(false);
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSaveButton, { backgroundColor: "#10B981" }]}
                  onPress={handleAddLink}
                  disabled={!newLink.trim()}
                >
                  <Text style={styles.modalSaveText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Learning Modal */}
        <Modal
          animationType="fade"
          transparent
          visible={learningModalVisible}
          onRequestClose={() => {
            setLearningModalVisible(false);
            setEditingLearningIndex(null);
            setNewLearning("");
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>
                {editingLearningIndex !== null ? 'Edit Learning' : 'Add Learning'}
              </Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 100 }]}
                placeholder="What did you learn?"
                value={newLearning}
                onChangeText={setNewLearning}
                autoFocus
                multiline
                textAlignVertical="top"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setNewLearning("");
                    setEditingLearningIndex(null);
                    setLearningModalVisible(false);
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSaveButton, { backgroundColor: "#3B82F6" }]}
                  onPress={handleAddLearning}
                  disabled={!newLearning.trim()}
                >
                  <Text style={styles.modalSaveText}>
                    {editingLearningIndex !== null ? 'Save' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Modal */}
        <NewIdeaModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          onSave={handleSaveEdit}
          ideaId={idea.id}
          initialIdea={idea}
        />

        <FileViewer
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
          files={idea.files?.map((uri) => ({ uri })) || []}
          currentIndex={viewerIndex}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
    paddingTop: Platform.OS === "android" ? 50 : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backdropFilter: "blur(10px)",
    // backgroundColor:"green"
  },
  headerLeft: {
    // backgroundColor: 'red',
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366F1",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  ideaCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    marginBottom: 16,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.1)",
  },
  ideaHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  ideaIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ideaInfo: {
    disfplay: "flex",
    flexDirection: "column",
  },
  ideaTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "600",
    marginLeft: 6,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 8,
  },
  descriptionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.1)",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  descriptionText: {
    fontSize: 16,
    color: "#111827",
    lineHeight: 24,
  },
  urlsList: {
    gap: 8,
  },
  urlItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.1)",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  urlIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  urlText: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  filesList: {
    gap: 8,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.1)",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  fileThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  fileType: {
    fontSize: 12,
    color: "#6B7280",
  },
  removeButton: {
    padding: 4,
  },
  sectionHeaderWithAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fileActions: {
    flexDirection: "row",
    gap: 8,
  },
  emptySection: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  topicsList: {
    gap: 8,
  },
  topicItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.1)",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  topicDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F59E0B",
    marginRight: 12,
  },
  topicText: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#F9FAFB",
    marginBottom: 16,
    minHeight: 48,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  learningsList: {
    gap: 10,
  },
  learningItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.1)",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  learningContent: {
    flex: 1,
    marginRight: 8,
  },
  learningText: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 20,
    marginBottom: 6,
  },
  learningDate: {
    fontSize: 11,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
});
