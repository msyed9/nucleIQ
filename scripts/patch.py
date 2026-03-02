import os

script_path = os.path.join(os.path.dirname(__file__), "generate_dummy_data.py")

with open(script_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace 1: End of generate_students
old_block_1 = """                        random.choices(CATEGORIES, CATEGORY_WEIGHTS)[0],
                        cls, sec, str(stu_num),
                    ])

        write_csv(os.path.join(OUTPUT_DIR, "05_students.csv"), headers, rows)"""

new_block_1 = """                        random.choices(CATEGORIES, CATEGORY_WEIGHTS)[0],
                        cls, sec, str(stu_num),
                    ])

        self._generate_100_special_students(rows, ay)
        write_csv(os.path.join(OUTPUT_DIR, "05_students.csv"), headers, rows)

    def _generate_100_special_students(self, rows, ay):
        # 100 students total
        
        # 20 pairs of siblings (40 students)
        for i in range(20):
            father_first, last, mother_first = random.choice(FIRST_NAMES_MALE), random.choice(LAST_NAMES), random.choice(FIRST_NAMES_FEMALE)
            father_phone, mother_phone, city = random_phone(), random_phone(), random.choice(CITIES)
            address = f"{random.randint(1,500)}, Nehru Colony, {city}"
            father_occ, mother_occ = random.choice(FATHER_OCCUPATIONS), random.choice(MOTHER_OCCUPATIONS)
            
            self.student_id_counter += 1
            gen1 = random.choice(["M", "F"])
            fn1 = random.choice(FIRST_NAMES_MALE if gen1 == "M" else FIRST_NAMES_FEMALE)
            cls_idx1 = random.randint(0, len(CLASSES)-3)
            self._add_special_student(rows, ay, fn1, last, gen1, cls_idx1, father_first, mother_first, father_phone, mother_phone, address, father_occ, mother_occ, "sibling_discount")
            
            self.student_id_counter += 1
            gen2 = random.choice(["M", "F"])
            fn2 = random.choice(FIRST_NAMES_MALE if gen2 == "M" else FIRST_NAMES_FEMALE)
            cls_idx2 = cls_idx1 + random.randint(1, 2)
            self._add_special_student(rows, ay, fn2, last, gen2, cls_idx2, father_first, mother_first, father_phone, mother_phone, address, father_occ, mother_occ, "sibling_discount")
            
        # 20 students for "partial fee payment"
        for i in range(20): self._add_random_special(rows, ay, "partial_fee")
        # 20 students for "pending fee from last year"
        for i in range(20): self._add_random_special(rows, ay, "pending_fee")
        # 20 students for "discounted fee"
        for i in range(20): self._add_random_special(rows, ay, "other_discount")

    def _add_random_special(self, rows, ay, scenario):
        self.student_id_counter += 1
        gender = random.choice(["M", "F"])
        fn = random.choice(FIRST_NAMES_MALE if gender == "M" else FIRST_NAMES_FEMALE)
        last = random.choice(LAST_NAMES)
        father_first, mother_first = random.choice(FIRST_NAMES_MALE), random.choice(FIRST_NAMES_FEMALE)
        city = random.choice(CITIES)
        address = f"{random.randint(1,500)}, Nehru Colony, {city}"
        self._add_special_student(rows, ay, fn, last, gender, random.randint(0, len(CLASSES)-1), father_first, mother_first, random_phone(), random_phone(), address, random.choice(FATHER_OCCUPATIONS), random.choice(MOTHER_OCCUPATIONS), scenario)

    def _add_special_student(self, rows, ay, first, last, gender, cls_idx, father_first, mother_first, father_phone, mother_phone, address, father_occ, mother_occ, scenario):
        cls = CLASSES[cls_idx]
        sec = random.choice(SECTIONS)
        admission_no = f"STU{self.student_id_counter:04d}"
        dob = random_dob(cls, ay["start"])
        admission_date = ay["start"] - timedelta(days=random.randint(0, 30))
        middle = ""
        student_record = {
            "admission_number": admission_no, "first_name": first, "last_name": last, "gender": gender,
            "dob": dob, "initial_class": cls, "initial_class_idx": cls_idx, "section": sec,
            "father_name": f"{father_first} {last}", "mother_name": f"{mother_first} {last}", "scenario": scenario
        }
        self.students.append(student_record)
        rows.append([
            first, admission_no, fmt_date(dob), gender, f"{father_first} {last}", f"{mother_first} {last}",
            father_phone, middle, last, fmt_date(admission_date), random_email(first, last, "student.nucleiq.in"), random_phone(),
            address, random.choices(BLOOD_GROUPS, BLOOD_GROUP_WEIGHTS)[0], mother_phone, random_email(father_first, last, "gmail.com"),
            random_email(mother_first, last, "gmail.com"), father_occ, mother_occ, random_aadhar(), "Indian", 
            random.choices(RELIGIONS, RELIGION_WEIGHTS)[0], random.choices(CATEGORIES, CATEGORY_WEIGHTS)[0],
            cls, sec, str(random.randint(1, 30)),
        ])"""

# Replace 2: Invoices and Payments loop
old_block_2 = """                for ft in FEE_TYPES:
                    amt = ft["amounts"][tier]
                    if amt <= 0:
                        continue

                    if ft["frequency"] == "MONTHLY":
                        # Generate monthly invoices (12 months)
                        for month_offset in range(12):
                            invoice_date = ay["start"] + timedelta(days=30 * month_offset)
                            if invoice_date > date(2026, 2, 26):
                                break
                            self.invoice_counter += 1
                            inv_no = f"INV/{ay['name']}/{self.invoice_counter:06d}"
                            due_date = invoice_date + timedelta(days=10)
                            inv_rows.append([inv_no, stu["admission_number"], ft["name"], amt, fmt_date(due_date), fmt_date(invoice_date), ay["name"]])

                            # 85% payment rate
                            if random.random() < 0.85:
                                self.receipt_counter += 1
                                rcp_no = f"RCP/{ay['name']}/{self.receipt_counter:06d}"
                                pay_date = due_date + timedelta(days=random.randint(-5, 15))
                                mode = random.choices(PAYMENT_MODES, PAYMENT_MODE_WEIGHTS)[0]
                                pay_rows.append([rcp_no, inv_no, amt, fmt_date(pay_date), mode, ""])
                    else:
                        # Non-monthly: 1 or 2 invoices
                        num_invoices = 1 if ft["frequency"] in ("YEARLY", "ONE_TIME") else 2
                        for i in range(num_invoices):
                            self.invoice_counter += 1
                            inv_no = f"INV/{ay['name']}/{self.invoice_counter:06d}"
                            invoice_date = ay["start"] + timedelta(days=180 * i)
                            if invoice_date > date(2026, 2, 26):
                                break
                            due_date = invoice_date + timedelta(days=15)
                            per_invoice_amt = amt // num_invoices
                            inv_rows.append([inv_no, stu["admission_number"], ft["name"], per_invoice_amt, fmt_date(due_date), fmt_date(invoice_date), ay["name"]])

                            if random.random() < 0.90:
                                self.receipt_counter += 1
                                rcp_no = f"RCP/{ay['name']}/{self.receipt_counter:06d}"
                                pay_date = due_date + timedelta(days=random.randint(-3, 10))
                                mode = random.choices(PAYMENT_MODES, PAYMENT_MODE_WEIGHTS)[0]
                                pay_rows.append([rcp_no, inv_no, per_invoice_amt, fmt_date(pay_date), mode, ""])"""

new_block_2 = """                for ft in FEE_TYPES:
                    amt = ft["amounts"][tier]
                    if amt <= 0:
                        continue

                    scenario = stu.get("scenario")
                    if scenario in ("sibling_discount", "other_discount"):
                        amt = int(amt * 0.8) # 20% discount applied

                    if ft["frequency"] == "MONTHLY":
                        # Generate monthly invoices (12 months)
                        for month_offset in range(12):
                            invoice_date = ay["start"] + timedelta(days=30 * month_offset)
                            if invoice_date > date(2026, 2, 26):
                                break
                            self.invoice_counter += 1
                            inv_no = f"INV/{ay['name']}/{self.invoice_counter:06d}"
                            due_date = invoice_date + timedelta(days=10)
                            inv_rows.append([inv_no, stu["admission_number"], ft["name"], amt, fmt_date(due_date), fmt_date(invoice_date), ay["name"]])

                            # Payment determination
                            if scenario == "pending_fee" and ay["name"] in ("2023-24", "2024-25"):
                                pass # no payment
                            elif scenario == "partial_fee" and random.random() < 0.5:
                                self.receipt_counter += 1
                                rcp_no = f"RCP/{ay['name']}/{self.receipt_counter:06d}"
                                pay_date = due_date + timedelta(days=random.randint(0, 5))
                                pay_rows.append([rcp_no, inv_no, amt // 2, fmt_date(pay_date), "CASH", "Partial payment"])
                            elif random.random() < 0.85:
                                self.receipt_counter += 1
                                rcp_no = f"RCP/{ay['name']}/{self.receipt_counter:06d}"
                                pay_date = due_date + timedelta(days=random.randint(-5, 15))
                                mode = random.choices(PAYMENT_MODES, PAYMENT_MODE_WEIGHTS)[0]
                                pay_rows.append([rcp_no, inv_no, amt, fmt_date(pay_date), mode, ""])
                    else:
                        # Non-monthly: 1 or 2 invoices
                        num_invoices = 1 if ft["frequency"] in ("YEARLY", "ONE_TIME") else 2
                        for i in range(num_invoices):
                            self.invoice_counter += 1
                            inv_no = f"INV/{ay['name']}/{self.invoice_counter:06d}"
                            invoice_date = ay["start"] + timedelta(days=180 * i)
                            if invoice_date > date(2026, 2, 26):
                                break
                            due_date = invoice_date + timedelta(days=15)
                            per_invoice_amt = amt // num_invoices
                            inv_rows.append([inv_no, stu["admission_number"], ft["name"], per_invoice_amt, fmt_date(due_date), fmt_date(invoice_date), ay["name"]])

                            if scenario == "pending_fee" and ay["name"] in ("2023-24", "2024-25"):
                                pass
                            elif scenario == "partial_fee" and random.random() < 0.5:
                                self.receipt_counter += 1
                                pay_rows.append([f"RCP/{ay['name']}/{self.receipt_counter:06d}", inv_no, per_invoice_amt // 2, fmt_date(due_date), "CASH", "Partial payment"])
                            elif random.random() < 0.90:
                                self.receipt_counter += 1
                                rcp_no = f"RCP/{ay['name']}/{self.receipt_counter:06d}"
                                pay_date = due_date + timedelta(days=random.randint(-3, 10))
                                mode = random.choices(PAYMENT_MODES, PAYMENT_MODE_WEIGHTS)[0]
                                pay_rows.append([rcp_no, inv_no, per_invoice_amt, fmt_date(pay_date), mode, ""])"""

# Replace 3: Max constants
old_block_3 = """        MAX_INVOICES = 5000
        MAX_PAYMENTS = 5000"""

new_block_3 = """        MAX_INVOICES = 50000
        MAX_PAYMENTS = 50000"""

# Replace 4: Photos
old_block_4 = """        try:
            from PIL import Image, ImageDraw, ImageFont
            USE_PIL = True
        except ImportError:
            USE_PIL = False

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for stu in self.students:
                adm = stu["admission_number"]
                initials = (stu["first_name"][0] + stu["last_name"][0]).upper()

                if USE_PIL:
                    # Generate a colored avatar with initials"""

new_block_4 = r"""        try:
            from PIL import Image, ImageDraw, ImageFont
            USE_PIL = True
        except ImportError:
            USE_PIL = False

        print("  ⏳ Loading AI human faces...")
        try:
            with open(r"C:\Users\syedmo\.gemini\antigravity\brain\4f85d770-8276-4abc-af93-3ff73656c2e1\ai_face_male_1772415091553.png", "rb") as f:
                male_face = f.read()
            with open(r"C:\Users\syedmo\.gemini\antigravity\brain\4f85d770-8276-4abc-af93-3ff73656c2e1\ai_face_female_1772415117964.png", "rb") as f:
                female_face = f.read()
            USE_AI = True
        except Exception as e:
            print("  ⚠️ AI faces fetch failed:", e)
            USE_AI = False

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for stu in self.students:
                adm = stu["admission_number"]
                initials = (stu["first_name"][0] + stu["last_name"][0]).upper()
                gender = stu.get("gender", "M")

                if USE_AI:
                    img_data = male_face if gender == "M" else female_face
                    zf.writestr(f"{adm}.jpg", img_data)
                elif USE_PIL:
                    # Generate a colored avatar with initials"""

content = content.replace(old_block_1, new_block_1)
content = content.replace(old_block_2, new_block_2)
content = content.replace(old_block_3, new_block_3)
content = content.replace(old_block_4, new_block_4)

with open(script_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied.")
