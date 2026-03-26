import React, { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { useQuery, useAction } from "wasp/client/operations";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getRestaurantAddOns,
  createAddOn,
  deleteAddOn,
  linkAddOnToMenuItem,
  unlinkAddOnFromMenuItem,
  createFileUploadUrl,
} from "wasp/client/operations";
import {
  Utensils,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Upload,
} from "lucide-react";
import { uploadFileWithProgress, validateFile } from "../../file-upload/fileUploading";

export default function DashboardMenuPage() {
  const { data: categories, isLoading: isCatsLoading } = useQuery(getCategories);
  const { data: globalAddOns, isLoading: isAddOnsLoading } = useQuery(getRestaurantAddOns);

  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const createCatAction = useAction(createCategory);
  const deleteCatAction = useAction(deleteCategory);
  const updateCatAction = useAction(updateCategory);

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", description: "", price: 0, image: "" });
  const [isUploading, setIsUploading] = useState(false);

  const createItemAction = useAction(createMenuItem);
  const updateItemAction = useAction(updateMenuItem);
  const deleteItemAction = useAction(deleteMenuItem);

  const [isAddingAddOn, setIsAddingAddOn] = useState(false);
  const [newAddOn, setNewAddOn] = useState({ name: "", price: 0 });

  const createAddOnAction = useAction(createAddOn);
  const deleteAddOnAction = useAction(deleteAddOn);
  const linkAddOnAction = useAction(linkAddOnToMenuItem);
  const unlinkAddOnAction = useAction(unlinkAddOnFromMenuItem);
  const createUploadUrlAction = useAction(createFileUploadUrl);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemData, setEditingItemData] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const validatedFile = validateFile(file);
      const { s3UploadUrl, s3UploadFields, s3Key } = await createUploadUrlAction({
        fileType: validatedFile.type,
        fileName: validatedFile.name,
      });

      await uploadFileWithProgress({
        file: validatedFile,
        s3UploadUrl,
        s3UploadFields,
        setUploadProgressPercent: (p) => console.log(`Upload progress: ${p}%`),
      });

      // Assuming a standard S3 bucket structure for the URL. In a real app, this should match your env.
      const imageUrl = `https://${s3UploadUrl.split("/")[2]}/${s3Key}`;

      if (isEditing) {
        setEditingItemData({ ...editingItemData, image: imageUrl });
      } else {
        setNewItem({ ...newItem, image: imageUrl });
      }
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      await createCatAction({ name: newCatName, displayOrder: categories?.length || 0 });
      setNewCatName("");
      setIsAddingCat(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItemData.name || editingItemData.price <= 0) return;
    try {
      await updateItemAction({
        id: editingItemData.id,
        name: editingItemData.name,
        description: editingItemData.description,
        price: editingItemData.price,
        image: editingItemData.image,
      });
      setEditingItemId(null);
      setEditingItemData(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMoveCat = async (id: string, currentOrder: number, direction: "up" | "down") => {
    const newOrder = direction === "up" ? currentOrder - 1 : currentOrder + 1;
    if (newOrder < 0) return;
    try {
      await updateCatAction({ id, displayOrder: newOrder });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId || !newItem.name || newItem.price <= 0) return;
    try {
      await createItemAction({ ...newItem, categoryId: selectedCatId });
      setNewItem({ name: "", description: "", price: 0, image: "" });
      setIsAddingItem(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleAvailability = async (id: string, isAvailable: boolean) => {
    try {
      await updateItemAction({ id, isAvailable: !isAvailable });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleAddOnForItem = async (menuItemId: string, addOnId: string, isLinked: boolean) => {
    try {
      if (isLinked) {
        await unlinkAddOnAction({ menuItemId, addOnId });
      } else {
        await linkAddOnAction({ menuItemId, addOnId });
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateAddOn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddOn.name || newAddOn.price < 0) return;
    try {
      await createAddOnAction(newAddOn);
      setNewAddOn({ name: "", price: 0 });
      setIsAddingAddOn(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isCatsLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
        </div>
      </DashboardLayout>
    );
  }

  const selectedCategory = categories?.find((c: any) => c.id === selectedCatId) || categories?.[0];
  if (categories && categories.length > 0 && !selectedCatId) {
    setSelectedCatId(categories[0].id);
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Categories Panel */}
        <div className="w-full md:w-72 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Categories</h2>
            <button
              onClick={() => setIsAddingCat(true)}
              className="p-1 text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-1">
            {isAddingCat && (
              <form onSubmit={handleCreateCat} className="mb-4 p-3 bg-white rounded-lg border border-yellow-200 shadow-sm">
                <input
                  autoFocus
                  className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-yellow-500 focus:ring-yellow-500 mb-2"
                  placeholder="Category Name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={() => setIsAddingCat(false)} className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-2 py-1">Cancel</button>
                  <button type="submit" className="text-[10px] font-bold uppercase tracking-wider bg-yellow-600 text-white px-2 py-1 rounded shadow-sm">Save</button>
                </div>
              </form>
            )}

            {categories?.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-4">No categories created.</p>
            ) : (
              categories?.map((cat: any, index: number) => (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all ${
                    selectedCatId === cat.id
                      ? "bg-yellow-600 text-white shadow-md scale-[1.02]"
                      : "text-gray-600 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <span className="truncate flex-1">{cat.name}</span>
                  <div className={`flex space-x-1 ${selectedCatId === cat.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMoveCat(cat.id, cat.displayOrder, "up"); }}
                      disabled={index === 0}
                      className="p-1 hover:bg-black/5 rounded disabled:opacity-30"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMoveCat(cat.id, cat.displayOrder, "down"); }}
                      disabled={index === categories.length - 1}
                      className="p-1 hover:bg-black/5 rounded disabled:opacity-30"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete category and all items?")) deleteCatAction({ id: cat.id });
                      }}
                      className="p-1 hover:bg-black/5 rounded text-red-400 group-hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Items Panel */}
        <div className="flex-1">
          {selectedCategory ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedCategory.name}</h2>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">
                    {selectedCategory.menuItems?.length || 0} Items
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingItem(true)}
                  className="flex items-center px-5 py-2.5 bg-yellow-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-yellow-200 hover:bg-yellow-700 hover:shadow-yellow-300 transition-all active:scale-95"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Item
                </button>
              </div>

              {isAddingItem && (
                <div className="mb-8 bg-white p-8 rounded-2xl border-2 border-yellow-100 shadow-xl">
                  <h3 className="text-lg font-bold mb-6 text-gray-900">Create New Item</h3>
                  <form onSubmit={handleCreateItem} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Item Name</label>
                      <input
                        required
                        className="w-full border-gray-200 rounded-xl px-4 py-3 focus:border-yellow-500 focus:ring-yellow-500 transition-all shadow-sm"
                        placeholder="e.g. Chicken Karahi"
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Price (PKR)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Rs.</span>
                        <input
                          type="number"
                          required
                          className="w-full border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:border-yellow-500 focus:ring-yellow-500 transition-all shadow-sm"
                          value={newItem.price}
                          onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Image</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="file-upload"
                          onChange={(e) => handleFileUpload(e)}
                        />
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer flex items-center justify-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm flex-1"
                        >
                          {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                          {newItem.image ? "Change Image" : "Upload Image"}
                        </label>
                        {newItem.image && <div className="h-10 w-10 bg-gray-100 rounded-lg overflow-hidden border"><img src={newItem.image} className="object-cover h-full w-full" /></div>}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Description</label>
                      <textarea
                        className="w-full border-gray-200 rounded-xl px-4 py-3 focus:border-yellow-500 focus:ring-yellow-500 transition-all shadow-sm"
                        rows={3}
                        placeholder="Tell your customers about this dish..."
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end space-x-4 mt-2">
                      <button type="button" onClick={() => setIsAddingItem(false)} className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                      <button type="submit" className="bg-yellow-600 text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-yellow-100 hover:bg-yellow-700 transition-all">Save Dish</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-4">
                {selectedCategory.menuItems?.length === 0 ? (
                  <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 flex flex-col items-center">
                    <Utensils className="h-12 w-12 mb-4 opacity-10" />
                    <p className="font-bold">No dishes in this category</p>
                    <p className="text-sm">Click "Add Item" to start your menu</p>
                  </div>
                ) : (
                  selectedCategory.menuItems?.map((item: any) => (
                    <div key={item.id} className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col ${!item.isAvailable ? "opacity-60 bg-gray-50" : ""}`}>
                      <div className="p-5 flex space-x-5">
                        <div className="h-24 w-24 shrink-0 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300 relative overflow-hidden group/img">
                          {item.image ? (
                            <img src={item.image} className="h-full w-full object-cover" alt={item.name} />
                          ) : (
                            <ImageIcon className="h-10 w-10 opacity-20" />
                          )}
                          {!item.isAvailable && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="text-[10px] font-black uppercase text-white tracking-widest bg-red-600 px-2 py-1 rounded">Sold Out</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg leading-tight">{item.name}</h4>
                              <p className="text-sm text-gray-500 line-clamp-2 mt-1 mb-2">{item.description || "No description provided."}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => toggleAvailability(item.id, item.isAvailable)}
                                className={`p-2 rounded-lg transition-colors ${item.isAvailable ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                                title={item.isAvailable ? "Mark Unavailable" : "Mark Available"}
                              >
                                {item.isAvailable ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                              </button>
                              <button
                                onClick={() => { if (confirm("Delete this item?")) deleteItemAction({ id: item.id }); }}
                                className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                             <p className="font-black text-yellow-600">Rs. {item.price}</p>
                             <div className="flex items-center space-x-3">
                               <button
                                 onClick={() => {
                                   setEditingItemId(item.id);
                                   setEditingItemData(item);
                                 }}
                                 className="text-xs font-bold text-gray-400 hover:text-yellow-600 flex items-center uppercase tracking-widest"
                               >
                                 Edit
                                 <Pencil className="ml-1 h-3 w-3" />
                               </button>
                               <button
                                 onClick={() => setEditingItemId(editingItemId === `addons-${item.id}` ? null : `addons-${item.id}`)}
                                 className="text-xs font-bold text-gray-400 hover:text-yellow-600 flex items-center uppercase tracking-widest"
                               >
                                 {editingItemId === `addons-${item.id}` ? "Close" : "Add-ons"}
                                 <MoreVertical className="ml-1 h-3 w-3" />
                               </button>
                             </div>
                          </div>
                        </div>
                      </div>

                      {/* Edit Item Form */}
                      {editingItemId === item.id && editingItemData && (
                        <div className="px-5 pb-5 pt-2 bg-gray-50/50 border-t border-gray-100">
                          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 mt-2">Edit Item</h5>
                          <form onSubmit={handleUpdateItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Name</label>
                              <input
                                required
                                className="w-full border-gray-200 rounded-lg text-sm px-3 py-2"
                                value={editingItemData.name}
                                onChange={(e) => setEditingItemData({ ...editingItemData, name: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Price (PKR)</label>
                              <input
                                type="number"
                                required
                                className="w-full border-gray-200 rounded-lg text-sm px-3 py-2"
                                value={editingItemData.price}
                                onChange={(e) => setEditingItemData({ ...editingItemData, price: parseFloat(e.target.value) })}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Image</label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id={`edit-file-upload-${editingItemData.id}`}
                                  onChange={(e) => handleFileUpload(e, true)}
                                />
                                <label
                                  htmlFor={`edit-file-upload-${editingItemData.id}`}
                                  className="cursor-pointer flex items-center justify-center px-4 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm flex-1"
                                >
                                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                  {editingItemData.image ? "Change" : "Upload"}
                                </label>
                                {editingItemData.image && <div className="h-8 w-8 bg-gray-100 rounded-md overflow-hidden border"><img src={editingItemData.image} className="object-cover h-full w-full" /></div>}
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Description</label>
                              <textarea
                                className="w-full border-gray-200 rounded-lg text-sm px-3 py-2"
                                rows={2}
                                value={editingItemData.description || ""}
                                onChange={(e) => setEditingItemData({ ...editingItemData, description: e.target.value })}
                              />
                            </div>
                            <div className="md:col-span-2 flex justify-end space-x-2 mt-2">
                              <button type="button" onClick={() => { setEditingItemId(null); setEditingItemData(null); }} className="text-xs font-bold text-gray-500 hover:text-gray-700 px-3 py-1.5 transition-all uppercase tracking-widest">Cancel</button>
                              <button type="submit" className="bg-yellow-600 text-white px-5 py-1.5 rounded-lg font-bold text-xs shadow-sm hover:bg-yellow-700 transition-all uppercase tracking-widest">Update</button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Per-item Add-on Section */}
                      {editingItemId === `addons-${item.id}` && (
                        <div className="px-5 pb-5 pt-2 bg-gray-50/50 border-t border-gray-100">
                          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Available Add-ons</h5>
                          <div className="flex flex-wrap gap-2">
                            {globalAddOns?.length === 0 ? (
                              <p className="text-xs text-gray-400 italic">Create global add-ons below first.</p>
                            ) : (
                              globalAddOns?.map((ao: any) => {
                                const isLinked = item.addOns?.some((itemAddOn: any) => itemAddOn.addOn.id === ao.id);
                                return (
                                  <button
                                    key={ao.id}
                                    onClick={() => toggleAddOnForItem(item.id, ao.id, isLinked)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                      isLinked
                                        ? "bg-yellow-600 border-yellow-600 text-white"
                                        : "bg-white border-gray-200 text-gray-600 hover:border-yellow-200"
                                    }`}
                                  >
                                    {ao.name} (+{ao.price})
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex h-96 items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 bg-white">
              <p className="font-bold">Select a category to manage items</p>
            </div>
          )}

          {/* Global Add-Ons Manager */}
          <div className="mt-16 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Manage Global Add-ons</h3>
                <p className="text-xs text-gray-500">Create add-ons here to use them on any dish</p>
              </div>
              <button
                onClick={() => setIsAddingAddOn(true)}
                className="p-2 bg-yellow-600 text-white rounded-lg shadow-sm hover:bg-yellow-700 transition-all"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {isAddingAddOn && (
                <form onSubmit={handleCreateAddOn} className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-yellow-50 p-6 rounded-2xl border border-yellow-100">
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-black text-yellow-700 uppercase tracking-widest mb-2">Add-on Name</label>
                    <input
                      required
                      placeholder="e.g. Extra Cheese"
                      className="w-full border-yellow-200 rounded-xl px-4 py-2.5 text-sm"
                      value={newAddOn.name}
                      onChange={(e) => setNewAddOn({ ...newAddOn, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-yellow-700 uppercase tracking-widest mb-2">Extra Price</label>
                    <input
                      type="number"
                      required
                      className="w-full border-yellow-200 rounded-xl px-4 py-2.5 text-sm"
                      value={newAddOn.price}
                      onChange={(e) => setNewAddOn({ ...newAddOn, price: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <button type="submit" className="flex-1 bg-yellow-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm">Save</button>
                    <button type="button" onClick={() => setIsAddingAddOn(false)} className="px-4 py-2.5 text-sm font-bold text-gray-500">Cancel</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {globalAddOns?.length === 0 ? (
                   <p className="col-span-full text-center py-6 text-sm text-gray-400 italic">No add-ons created yet.</p>
                ) : (
                  globalAddOns?.map((ao: any) => (
                    <div key={ao.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center group shadow-sm hover:shadow-md transition-all">
                      <div>
                        <div className="text-sm font-bold text-gray-900">{ao.name}</div>
                        <div className="text-xs text-yellow-600 font-bold">Rs. {ao.price}</div>
                      </div>
                      <button
                        onClick={() => { if (confirm("Delete add-on? This will remove it from all dishes.")) deleteAddOnAction({ id: ao.id }); }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-600 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
