/**
 * Website Builder Screen - Mobile
 * Template gallery and website management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    TextInput,
    Modal,
    FlatList,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cmsAPI } from '../../services/api';

const { width } = Dimensions.get('window');

interface Template {
    id: number;
    name: string;
    description: string;
    category: string;
    thumbnail: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    pages_count: number;
    is_system: boolean;
    is_custom: boolean;
}

interface Instance {
    id: number;
    name: string;
    source_template_name: string;
    subdomain: string;
    is_published: boolean;
    status: string;
}

interface Category {
    id: string;
    name: string;
    icon: string;
}

const WebsiteBuilderScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [instances, setInstances] = useState<Instance[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showForkModal, setShowForkModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [newWebsiteName, setNewWebsiteName] = useState('');
    const [forking, setForking] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [templatesRes, instancesRes, categoriesRes] = await Promise.all([
                cmsAPI.getTemplates(),
                cmsAPI.getInstances(),
                cmsAPI.getCategories(),
            ]);
            setTemplates(templatesRes);
            setInstances(instancesRes);
            setCategories(categoriesRes);
        } catch (error) {
            console.error('Failed to load data:', error);
            Alert.alert('Error', 'Failed to load website builder data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, []);

    const filteredTemplates = selectedCategory === 'all'
        ? templates
        : templates.filter(t => t.category === selectedCategory);

    const handleForkTemplate = async () => {
        if (!selectedTemplate || !newWebsiteName.trim()) return;

        setForking(true);
        try {
            await cmsAPI.forkTemplate(selectedTemplate.id, {
                name: newWebsiteName.trim()
            });
            Alert.alert('Success', 'Website created successfully!');
            setShowForkModal(false);
            setNewWebsiteName('');
            setSelectedTemplate(null);
            loadData();
        } catch (error) {
            console.error('Failed to fork template:', error);
            Alert.alert('Error', 'Failed to create website');
        } finally {
            setForking(false);
        }
    };

    const handlePublishToggle = async (instance: Instance) => {
        try {
            if (instance.is_published) {
                await cmsAPI.unpublishInstance(instance.id);
            } else {
                await cmsAPI.publishInstance(instance.id);
            }
            loadData();
        } catch (error) {
            console.error('Failed to toggle publish:', error);
            Alert.alert('Error', 'Failed to update website status');
        }
    };

    const parseGradient = (thumbnail: string): [string, string] => {
        // Parse linear-gradient string to extract colors
        const match = thumbnail.match(/#[a-fA-F0-9]{6}/g);
        if (match && match.length >= 2) {
            return [match[0], match[1]];
        }
        return ['#667eea', '#764ba2'];
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading Website Builder...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>🌐 Website Builder</Text>
                <Text style={styles.subtitle}>Create stunning websites for your institution</Text>
            </View>

            {/* Your Websites */}
            {instances.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📁 Your Websites</Text>
                    {instances.map(instance => (
                        <TouchableOpacity
                            key={instance.id}
                            style={styles.instanceCard}
                            onPress={() => navigation.navigate('WebsiteEditor', { instanceId: instance.id })}
                        >
                            <View style={styles.instanceHeader}>
                                <Text style={styles.instanceName}>{instance.name}</Text>
                                <View style={[styles.statusBadge, instance.is_published ? styles.published : styles.draft]}>
                                    <Text style={styles.statusText}>
                                        {instance.is_published ? '🟢 Published' : '🟡 Draft'}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.instanceTemplate}>
                                Based on: {instance.source_template_name}
                            </Text>
                            <View style={styles.instanceActions}>
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => navigation.navigate('WebsiteEditor', { instanceId: instance.id })}
                                >
                                    <Text style={styles.actionBtnText}>✏️ Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.actionBtnSecondary]}
                                    onPress={() => handlePublishToggle(instance)}
                                >
                                    <Text style={styles.actionBtnTextSecondary}>
                                        {instance.is_published ? '📤 Unpublish' : '🚀 Publish'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Category Filter */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📚 Template Gallery</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                    <TouchableOpacity
                        style={[styles.categoryBtn, selectedCategory === 'all' && styles.categoryBtnActive]}
                        onPress={() => setSelectedCategory('all')}
                    >
                        <Text style={[styles.categoryText, selectedCategory === 'all' && styles.categoryTextActive]}>
                            All
                        </Text>
                    </TouchableOpacity>
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[styles.categoryBtn, selectedCategory === cat.id && styles.categoryBtnActive]}
                            onPress={() => setSelectedCategory(cat.id)}
                        >
                            <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
                                {cat.icon} {cat.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Templates Grid */}
            <View style={styles.templatesGrid}>
                {filteredTemplates.map(template => {
                    const gradientColors = parseGradient(template.thumbnail);
                    return (
                        <TouchableOpacity
                            key={template.id}
                            style={styles.templateCard}
                            onPress={() => {
                                setSelectedTemplate(template);
                                setNewWebsiteName(`${template.name} - My Website`);
                                setShowForkModal(true);
                            }}
                        >
                            <LinearGradient
                                colors={gradientColors}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.templatePreview}
                            >
                                {template.is_custom && (
                                    <View style={styles.customBadge}>
                                        <Text style={styles.customBadgeText}>Custom</Text>
                                    </View>
                                )}
                            </LinearGradient>
                            <View style={styles.templateInfo}>
                                <Text style={styles.templateName}>{template.name}</Text>
                                <Text style={styles.templateDesc} numberOfLines={2}>
                                    {template.description}
                                </Text>
                                <View style={styles.templateMeta}>
                                    <Text style={styles.templatePages}>{template.pages_count} pages</Text>
                                    <View style={styles.templateColors}>
                                        <View style={[styles.colorDot, { backgroundColor: template.primary_color }]} />
                                        <View style={[styles.colorDot, { backgroundColor: template.secondary_color }]} />
                                        <View style={[styles.colorDot, { backgroundColor: template.accent_color }]} />
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Fork Template Modal */}
            <Modal
                visible={showForkModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowForkModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>🚀 Create Website</Text>
                        {selectedTemplate && (
                            <Text style={styles.modalSubtitle}>
                                Using template: {selectedTemplate.name}
                            </Text>
                        )}
                        <TextInput
                            style={styles.input}
                            value={newWebsiteName}
                            onChangeText={setNewWebsiteName}
                            placeholder="Enter website name"
                            placeholderTextColor="#94a3b8"
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnSecondary]}
                                onPress={() => setShowForkModal(false)}
                            >
                                <Text style={styles.modalBtnTextSecondary}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnPrimary]}
                                onPress={handleForkTemplate}
                                disabled={forking || !newWebsiteName.trim()}
                            >
                                {forking ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.modalBtnTextPrimary}>Create</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingText: {
        marginTop: 12,
        color: '#64748b',
        fontSize: 16,
    },
    header: {
        padding: 20,
        paddingTop: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 12,
        paddingHorizontal: 20,
    },
    instanceCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    instanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    instanceName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    published: {
        backgroundColor: '#d1fae5',
    },
    draft: {
        backgroundColor: '#fef3c7',
    },
    statusText: {
        fontSize: 12,
    },
    instanceTemplate: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 12,
    },
    instanceActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    actionBtnSecondary: {
        backgroundColor: '#f1f5f9',
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    actionBtnTextSecondary: {
        color: '#1e293b',
        fontWeight: '600',
        fontSize: 14,
    },
    categoriesScroll: {
        paddingHorizontal: 20,
    },
    categoryBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    categoryBtnActive: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    categoryText: {
        fontSize: 14,
        color: '#64748b',
    },
    categoryTextActive: {
        color: '#fff',
    },
    templatesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        paddingBottom: 40,
    },
    templateCard: {
        width: (width - 48) / 2,
        backgroundColor: '#fff',
        borderRadius: 12,
        margin: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    templatePreview: {
        height: 100,
        position: 'relative',
    },
    customBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    customBadgeText: {
        color: '#fff',
        fontSize: 10,
    },
    templateInfo: {
        padding: 12,
    },
    templateName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    templateDesc: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 8,
        lineHeight: 16,
    },
    templateMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    templatePages: {
        fontSize: 11,
        color: '#94a3b8',
    },
    templateColors: {
        flexDirection: 'row',
        gap: 4,
    },
    colorDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#fff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1e293b',
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalBtnPrimary: {
        backgroundColor: '#2563eb',
    },
    modalBtnSecondary: {
        backgroundColor: '#f1f5f9',
    },
    modalBtnTextPrimary: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    modalBtnTextSecondary: {
        color: '#64748b',
        fontWeight: '600',
        fontSize: 16,
    },
});

export default WebsiteBuilderScreen;
