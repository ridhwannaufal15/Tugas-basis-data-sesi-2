const API_URL = 'http://localhost:3000/api/items';

let isEditing = false;

const itemForm = document.getElementById('itemForm');
const itemTableBody = document.getElementById('itemTableBody');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('formTitle');

document.addEventListener('DOMContentLoaded', loadItems);

itemForm.addEventListener('submit', handleFormSubmit);
cancelBtn.addEventListener('click', resetForm);

async function loadItems() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch data');
        const items = await response.json();
        renderTable(items);
    } catch (error) {
        console.error('Error loading items:', error);
        itemTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:red;"> Gagal memuat data.</td></tr>`;
    }
}

function renderTable(items) {
    if (items.length === 0) {
        itemTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Tambahkan barang!</td></tr>`;
        return;
    }

    itemTableBody.innerHTML = items.map(item => `
        <tr>
            <td>${item.id}</td>
            <td><strong>${escapeHtml(item.nama_barang)}</strong></td>
            <td>${escapeHtml(item.kategori || '-')}</td>
            <td>${item.jumlah}</td>
            <td><span class="badge ${item.kondisi_barang === 'Rusak' ? 'badge-danger' : item.kondisi_barang === 'Perbaikan' ? 'badge-warning' : 'badge-success'}">${escapeHtml(item.kondisi_barang || '-')}</span></td>
            <td>${escapeHtml(item.lokasi || '-')}</td>
            <td>
                 <button class="btn btn-primary-stok" onclick="bukaModalStok(${item.id})">+ Stok</button>
                 <button class="btn btn-warning" onclick="editItem(${item.id})">Edit</button>
                 <button class="btn btn-danger" onclick="deleteItem(${item.id})">Hapus</button>
            </td>
        </tr>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('itemId').value;
    const nama_barang = document.getElementById('nama_barang').value.trim();
    const kategori = document.getElementById('kategori').value.trim();
    const jumlah = parseInt(document.getElementById('jumlah').value) || 0;
    const kondisi_barang = document.getElementById('kondisi_barang').value;
    const lokasi = document.getElementById('lokasi').value.trim();

    if (!nama_barang) {
        alert(' Nama barang wajib diisi!');
        return;
    }

    if (jumlah < 0) {
        alert(' Jumlah tidak boleh negatif!');
        return;
    }

    const itemData = { nama_barang, kategori, jumlah, kondisi_barang, lokasi };

    try {
        let response;
        if (isEditing && id) {
         
            response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData)
            });
            if (!response.ok) throw new Error('Update failed');
            alert(' Data berhasil diupdate!');
        } else {
            
            response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData)
            });
            if (!response.ok) throw new Error('Create failed');
            alert(' Data berhasil ditambahkan!');
        }

        resetForm();
        loadItems();
    } catch (error) {
        console.error('Error saving item:', error);
        alert(' Gagal menyimpan data. Silakan coba lagi.');
    }
}

async function editItem(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error('Failed to fetch item');
        const item = await response.json();

        document.getElementById('itemId').value = item.id;
        document.getElementById('nama_barang').value = item.nama_barang;
        document.getElementById('kategori').value = item.kategori || '';
        document.getElementById('jumlah').value = item.jumlah || 0;
        document.getElementById('kondisi_barang').value = item.kondisi_barang || 'Baik';
        document.getElementById('lokasi').value = item.lokasi || '';

        isEditing = true;
        submitBtn.textContent = 'Update Barang';
        formTitle.textContent = 'Edit Barang';
        cancelBtn.style.display = 'inline-block';
        
        document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error editing item:', error);
        alert(' Gagal memuat data untuk diedit.');
    }
}

async function deleteItem(id) {
    if (!confirm(' Apakah Anda yakin ingin menghapus item ini?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Delete failed');
        alert(' Data berhasil dihapus!');
        loadItems();
    } catch (error) {
        console.error('Error deleting item:', error);
        alert(' Gagal menghapus data.');
    }
}

function resetForm() {
    itemForm.reset();
    document.getElementById('itemId').value = '';
    document.getElementById('jumlah').value = '0';
    isEditing = false;
    submitBtn.textContent = 'Tambah Barang';
    formTitle.textContent = 'Tambah Barang';
    cancelBtn.style.display = 'none';
}

// ==================== FITUR TAMBAH STOK ====================

async function bukaModalStok(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error('Gagal ambil data');
        const item = await response.json();

        currentStokItem = item;

        document.getElementById('modalStokTitle').textContent = 
            `Tambah Stok: ${item.nama_barang}`;
        document.getElementById('modalStokInfo').innerHTML = 
            `Stok saat ini: <strong>${item.jumlah}</strong>` +
            (item.kategori ? ` | Kategori: ${escapeHtml(item.kategori)}` : '');
        document.getElementById('inputJumlahStok').value = 1;

        document.getElementById('modalStok').style.display = 'flex';
        document.getElementById('inputJumlahStok').focus();
    } catch (error) {
        console.error('Error buka modal stok:', error);
        alert(' Gagal memuat data barang.');
    }
}

function tutupModalStok() {
    document.getElementById('modalStok').style.display = 'none';
    currentStokItem = null;
}

async function simpanTambahStok() {
    if (!currentStokItem) return;

    const jumlahTambah = parseInt(document.getElementById('inputJumlahStok').value);

    if (isNaN(jumlahTambah) || jumlahTambah <= 0) {
        alert(' Jumlah tambahan harus angka positif!');
        return;
    }

    const stokBaru = (currentStokItem.jumlah || 0) + jumlahTambah;

    const updatedData = {
        nama_barang: currentStokItem.nama_barang,
        kategori: currentStokItem.kategori,
        jumlah: stokBaru,
        kondisi_barang: currentStokItem.kondisi_barang,
        lokasi: currentStokItem.lokasi
    };

    try {
        const response = await fetch(`${API_URL}/${currentStokItem.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) throw new Error('Gagal update stok');

        alert(` Stok "${currentStokItem.nama_barang}" berhasil ditambah ${jumlahTambah}.\nStok baru: ${stokBaru}`);

        tutupModalStok();
        loadItems();
    } catch (error) {
        console.error('Error simpan tambah stok:', error);
        alert(' Gagal menambah stok. Silakan coba lagi.');
    }
}

// Tutup modal kalau klik area gelap
document.getElementById('modalStok').addEventListener('click', function(e) {
    if (e.target === this) tutupModalStok();
});

// Tutup dengan tombol ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') tutupModalStok();
});