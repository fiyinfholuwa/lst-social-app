import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AppIcon from './AppIcon';

export default function PostOptionsMenu({ onCopyLink, onEdit, onDelete, onReport }) {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { theme } = useTheme();

  const choose = action => {
    setOpen(false);
    action?.();
  };

  const requestDelete = () => {
    setOpen(false);
    setConfirmingDelete(true);
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
        onPress={event => {
          event.stopPropagation?.();
          setOpen(true);
        }}
        hitSlop={8}
        accessibilityLabel="Post options"
      >
        <AppIcon name="ellipsis-h" size={19} color={open ? theme.primary : theme.secondaryText} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.menu, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => {}}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
            <Text style={[styles.menuTitle, { color: theme.text }]}>Post options</Text>
            <TouchableOpacity style={styles.row} onPress={() => choose(onCopyLink)} accessibilityLabel="Copy post link"><View style={[styles.iconWrap, { backgroundColor: theme.primarySoft }]}><AppIcon name="copy-outline" size={18} color={theme.primary} /></View><Text style={[styles.rowText, { color: theme.text }]}>Copy link</Text></TouchableOpacity>
            {onEdit ? <TouchableOpacity style={styles.row} onPress={() => choose(onEdit)} accessibilityLabel="Edit post"><View style={[styles.iconWrap, { backgroundColor: theme.primarySoft }]}><AppIcon name="create-outline" size={18} color={theme.primary} /></View><Text style={[styles.rowText, { color: theme.text }]}>Edit post</Text></TouchableOpacity> : null}
            {onDelete ? <TouchableOpacity style={styles.row} onPress={requestDelete} accessibilityLabel="Delete post"><View style={[styles.iconWrap, { backgroundColor: theme.accentSoft }]}><AppIcon name="trash" size={18} color={theme.danger} /></View><Text style={[styles.rowText, { color: theme.danger }]}>Delete post</Text></TouchableOpacity> : null}
            {onReport ? <TouchableOpacity style={styles.row} onPress={() => choose(onReport)} accessibilityLabel="Report post"><View style={[styles.iconWrap, { backgroundColor: theme.accentSoft }]}><AppIcon name="flag" size={18} color={theme.danger} /></View><Text style={[styles.rowText, { color: theme.text }]}>Report post</Text></TouchableOpacity> : null}
            <TouchableOpacity style={[styles.closeButton, { borderColor: theme.border }]} onPress={() => setOpen(false)} accessibilityLabel="Close post options"><Text style={[styles.closeText, { color: theme.text }]}>Cancel</Text></TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

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
  menuBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(28,17,24,0.56)' },
  menu: {
    width: '100%',
    padding: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
  },
  handle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 15 },
  menuTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10 },
  row: { minHeight: 54, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, fontSize: 14, fontWeight: '800' },
  iconWrap: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  closeButton: { height: 50, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  closeText: { fontSize: 13, fontWeight: '800' },
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
