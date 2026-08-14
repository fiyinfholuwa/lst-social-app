import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AppIcon from './AppIcon';

export default function PostOptionsMenu({ onEdit, onDelete, onReport }) {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { theme } = useTheme();

  const choose = action => {
    setOpen(false);
    action?.();
  };

  const confirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await onDelete?.();
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.anchor}>
      <TouchableOpacity
        style={[styles.trigger, open && { backgroundColor: theme.primarySoft }]}
        onPress={() => setOpen(value => !value)}
        hitSlop={8}
        accessibilityLabel="Post options"
      >
        <AppIcon name="ellipsis-h" size={19} color={open ? theme.primary : theme.secondaryText} />
      </TouchableOpacity>

      {open ? (
        <View style={[styles.menu, { width: 14 + ([onEdit, onDelete, onReport].filter(Boolean).length * 48), backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.text }]}>
          {onReport ? <TouchableOpacity style={styles.row} onPress={() => choose(onReport)} accessibilityLabel="Report post"><View style={[styles.iconWrap, { backgroundColor: theme.accentSoft }]}><AppIcon name="flag" size={18} color={theme.danger} /></View></TouchableOpacity> : null}
          {onReport && (onEdit || onDelete) ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
          {onEdit ? <>
          <TouchableOpacity style={styles.row} onPress={() => choose(onEdit)} accessibilityLabel="Edit post">
            <View style={[styles.iconWrap, { backgroundColor: theme.primarySoft }]}>
              <AppIcon name="create-outline" size={18} color={theme.primary} />
            </View>
          </TouchableOpacity>
          </> : null}
          {onEdit && onDelete ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
          {onDelete ?
          <TouchableOpacity style={styles.row} onPress={() => choose(() => setConfirmingDelete(true))} accessibilityLabel="Delete post">
            <View style={[styles.iconWrap, { backgroundColor: theme.accentSoft }]}>
              <AppIcon name="trash" size={18} color={theme.danger} />
            </View>
          </TouchableOpacity> : null}
        </View>
      ) : null}

      <Modal visible={confirmingDelete} transparent animationType="fade" onRequestClose={() => !deleting && setConfirmingDelete(false)}>
        <Pressable style={styles.backdrop} onPress={() => !deleting && setConfirmingDelete(false)}>
          <Pressable style={[styles.dialog, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => {}}>
            <View style={[styles.dialogIcon, { backgroundColor: theme.accentSoft }]}>
              <AppIcon name="trash" size={25} color={theme.danger} />
            </View>
            <Text style={[styles.dialogTitle, { color: theme.text }]}>Delete this post?</Text>
            <Text style={[styles.dialogBody, { color: theme.secondaryText }]}>This will permanently remove the post, its photos, comments, and reactions.</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.border }]} onPress={() => setConfirmingDelete(false)} disabled={deleting}>
                <Text style={[styles.cancelText, { color: theme.text }]}>Keep post</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.deleteButton, { backgroundColor: theme.danger }]} onPress={confirmDelete} disabled={deleting}>
                {deleting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <><AppIcon name="trash" size={15} color="#FFFFFF" /><Text style={styles.deleteText}>Delete</Text></>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { position: 'relative', zIndex: 1000, elevation: 30 },
  trigger: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menu: {
    position: 'absolute',
    top: 39,
    right: 0,
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    zIndex: 1001,
    elevation: 32,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  row: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  divider: { width: StyleSheet.hairlineWidth, height: 30, marginHorizontal: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(28,17,24,0.56)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 350, borderWidth: 1, borderRadius: 26, padding: 22, alignItems: 'center', shadowColor: '#000000', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.2, shadowRadius: 30, elevation: 24 },
  dialogIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  dialogTitle: { fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },
  dialogBody: { fontSize: 13.5, lineHeight: 20, textAlign: 'center', marginTop: 8, paddingHorizontal: 8 },
  dialogActions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 22 },
  cancelButton: { flex: 1, height: 50, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 13, fontWeight: '800' },
  deleteButton: { flex: 1, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  deleteText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
