 // Données initiales (simulées)
        let vehicles = JSON.parse(localStorage.getItem('garage_vehicles')) || [];
        
        // Références aux éléments du DOM
        const vehiclesTableBody = document.getElementById('vehicles-table-body');
        const addVehicleBtn = document.getElementById('add-vehicle-btn');
        const vehicleModal = document.getElementById('vehicle-modal');
        const closeModal = document.getElementById('close-modal');
        const vehicleForm = document.getElementById('vehicle-form');
        const dateFilter = document.getElementById('date');
        const todayVehiclesElement = document.getElementById('today-vehicles');
        const todayOilChangesElement = document.getElementById('today-oil-changes');
        const inProgressElement = document.getElementById('in-progress');
        const completedElement = document.getElementById('completed');
        const oilChangesSummaryElement = document.getElementById('oil-changes-summary');
        const interventionOptions = document.querySelectorAll('.intervention-option');
        const interventionInput = document.getElementById('intervention');
        const mechanicSelect = document.getElementById('mecanicien-select');
        const addMechanicBtn = document.getElementById('add-mechanic-btn');
        const selectedMechanicsList = document.getElementById('selected-mechanics-list');
        
        // Liste des mécaniciens sélectionnés pour le véhicule en cours
        let selectedMechanics = [];

        // Initialisation de la date du jour
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        dateFilter.value = formattedDate;

        // Afficher les véhicules dans le tableau
        function renderVehicles() {
            const selectedDate = dateFilter.value;
            const filteredVehicles = vehicles.filter(vehicle => vehicle.date === selectedDate);
            
            vehiclesTableBody.innerHTML = '';
            
            let todayVehiclesCount = 0;
            let todayOilChangesCount = 0;
            let inProgressCount = 0;
            let completedCount = 0;
            
            filteredVehicles.forEach((vehicle, index) => {
                const row = document.createElement('tr');
                
                // Compter les statistiques
                todayVehiclesCount++;
                if (vehicle.intervention === 'Vidange' || vehicle.intervention.includes('Vidange')) todayOilChangesCount++;
                if (vehicle.statut === 'En cours') inProgressCount++;
                if (vehicle.statut === 'Terminé') completedCount++;
                
                // Déterminer la classe CSS pour le statut
                let statusClass = '';
                if (vehicle.statut === 'En cours') statusClass = 'status-en-cours';
                else if (vehicle.statut === 'Terminé') statusClass = 'status-termine';
                else if (vehicle.statut === 'En attente') statusClass = 'status-en-attente';
                
                // Formater les mécaniciens
                let mechanicsDisplay = '';
                if (Array.isArray(vehicle.mecaniciens)) {
                    mechanicsDisplay = vehicle.mecaniciens.join(', ');
                } else {
                    mechanicsDisplay = vehicle.mecaniciens || '';
                }
                
                row.innerHTML = `
                    <td>${vehicle.immatriculation}</td>
                    <td>${vehicle.modele}</td>
                    <td>${vehicle.intervention}</td>
                    <td>${mechanicsDisplay}</td>
                    <td><span class="status ${statusClass}">${vehicle.statut}</span></td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="editVehicle(${index})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="deleteVehicle(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                vehiclesTableBody.appendChild(row);
            });
            
            // Mettre à jour les compteurs
            todayVehiclesElement.textContent = todayVehiclesCount;
            todayOilChangesElement.textContent = todayOilChangesCount;
            inProgressElement.textContent = inProgressCount;
            completedElement.textContent = completedCount;
            
            // Mettre à jour le récapitulatif des vidanges
            updateOilChangesSummary(filteredVehicles);
        }

        // Mettre à jour le récapitulatif des vidanges
        function updateOilChangesSummary(vehiclesList) {
            const oilChanges = vehiclesList.filter(v => 
                v.intervention === 'Vidange' || v.intervention.includes('Vidange')
            );
            
            const mechanicsSummary = {};
            
            oilChanges.forEach(vehicle => {
                let mechanics = [];
                if (Array.isArray(vehicle.mecaniciens)) {
                    mechanics = vehicle.mecaniciens;
                } else if (vehicle.mecaniciens) {
                    mechanics = [vehicle.mecaniciens];
                }
                
                mechanics.forEach(mechanic => {
                    if (!mechanicsSummary[mechanic]) {
                        mechanicsSummary[mechanic] = {
                            count: 0,
                            vehicles: []
                        };
                    }
                    
                    mechanicsSummary[mechanic].count++;
                    mechanicsSummary[mechanic].vehicles.push(vehicle.immatriculation);
                });
            });
            
            oilChangesSummaryElement.innerHTML = '';
            
            for (const mechanic in mechanicsSummary) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${mechanic}</td>
                    <td>${mechanicsSummary[mechanic].count}</td>
                    <td>${mechanicsSummary[mechanic].vehicles.join(', ')}</td>
                `;
                oilChangesSummaryElement.appendChild(row);
            }
            
            if (Object.keys(mechanicsSummary).length === 0) {
                oilChangesSummaryElement.innerHTML = '<tr><td colspan="3" style="text-align: center;">Aucune vidange aujourd\'hui</td></tr>';
            }
        }

        // Ouvrir le modal pour ajouter un véhicule
        addVehicleBtn.addEventListener('click', () => {
            vehicleModal.style.display = 'flex';
            vehicleForm.reset();
            selectedMechanics = [];
            updateSelectedMechanicsList();
        });

        // Fermer le modal
        closeModal.addEventListener('click', () => {
            vehicleModal.style.display = 'none';
        });

        // Ajouter un mécanicien à la liste
        addMechanicBtn.addEventListener('click', () => {
            const selectedMechanic = mechanicSelect.value;
            if (selectedMechanic && !selectedMechanics.includes(selectedMechanic)) {
                selectedMechanics.push(selectedMechanic);
                updateSelectedMechanicsList();
            }
        });

        // Mettre à jour l'affichage des mécaniciens sélectionnés
        function updateSelectedMechanicsList() {
            selectedMechanicsList.innerHTML = '';
            selectedMechanics.forEach(mechanic => {
                const tag = document.createElement('div');
                tag.className = 'mechanic-tag';
                tag.innerHTML = `
                    ${mechanic}
                    <button type="button" onclick="removeMechanic('${mechanic}')">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                selectedMechanicsList.appendChild(tag);
            });
            
            if (selectedMechanics.length === 0) {
                selectedMechanicsList.innerHTML = '<p>Aucun mécanicien sélectionné</p>';
            }
        }

        // Supprimer un mécanicien de la liste
        window.removeMechanic = function(mechanic) {
            selectedMechanics = selectedMechanics.filter(m => m !== mechanic);
            updateSelectedMechanicsList();
        };

        // Gérer les options d'intervention prédéfinies
        interventionOptions.forEach(option => {
            option.addEventListener('click', () => {
                interventionInput.value = option.getAttribute('data-value');
            });
        });

        // Soumettre le formulaire
        vehicleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const immatriculation = document.getElementById('immatriculation').value;
            const modele = document.getElementById('modele').value;
            const intervention = document.getElementById('intervention').value;
            const statut = document.getElementById('statut').value;
            const date = dateFilter.value;
            
            const newVehicle = {
                immatriculation,
                modele,
                intervention,
                mecaniciens: [...selectedMechanics], // Copie du tableau
                statut,
                date
            };
            
            vehicles.push(newVehicle);
            localStorage.setItem('garage_vehicles', JSON.stringify(vehicles));
            
            renderVehicles();
            vehicleModal.style.display = 'none';
        });

        // Filtrer les véhicules par date
        dateFilter.addEventListener('change', renderVehicles);

        // Fermer le modal si on clique en dehors
        window.addEventListener('click', (e) => {
            if (e.target === vehicleModal) {
                vehicleModal.style.display = 'none';
            }
        });

        // Fonctions pour éditer et supprimer (simplifiées pour cet exemple)
        window.editVehicle = function(index) {
            const selectedDate = dateFilter.value;
            const filteredVehicles = vehicles.filter(vehicle => vehicle.date === selectedDate);
            const vehicle = filteredVehicles[index];
            
            document.getElementById('immatriculation').value = vehicle.immatriculation;
            document.getElementById('modele').value = vehicle.modele;
            document.getElementById('intervention').value = vehicle.intervention;
            document.getElementById('statut').value = vehicle.statut;
            
            // Gérer les mécaniciens
            if (Array.isArray(vehicle.mecaniciens)) {
                selectedMechanics = [...vehicle.mecaniciens];
            } else if (vehicle.mecaniciens) {
                selectedMechanics = [vehicle.mecaniciens];
            } else {
                selectedMechanics = [];
            }
            updateSelectedMechanicsList();
            
            // Pour simplifier, on supprime et on recrée
            vehicles = vehicles.filter(v => v !== vehicle);
            localStorage.setItem('garage_vehicles', JSON.stringify(vehicles));
            
            vehicleModal.style.display = 'flex';
        };

        window.deleteVehicle = function(index) {
            const selectedDate = dateFilter.value;
            const filteredVehicles = vehicles.filter(vehicle => vehicle.date === selectedDate);
            const vehicle = filteredVehicles[index];
            
            if (confirm("Êtes-vous sûr de vouloir supprimer ce véhicule ?")) {
                vehicles = vehicles.filter(v => v !== vehicle);
                localStorage.setItem('garage_vehicles', JSON.stringify(vehicles));
                renderVehicles();
            }
        };

        // Initialiser l'affichage
        renderVehicles();